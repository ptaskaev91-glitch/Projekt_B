import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════

// Config is injected via Vite env. See `.env.example`.
export const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const SUPABASE_ANON_KEY_LEGACY = import.meta.env.VITE_SUPABASE_ANON_KEY_LEGACY ?? "";

const SUPABASE_KEY = SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY_LEGACY;

function deriveProjectRef(url: string) {
  const match = url.match(/^https?:\/\/([^.]+)\.supabase\.co/i);
  return match?.[1] ?? "unknown";
}

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "x-application-name": "horde-chat-web",
    },
  },
});

export const supabaseProjectMeta = {
  url: SUPABASE_PROJECT_URL,
  publishableKey: SUPABASE_PUBLISHABLE_KEY,
  legacyAnonKey: SUPABASE_ANON_KEY_LEGACY,
  projectRef: deriveProjectRef(SUPABASE_PROJECT_URL),
} as const;

export function maskSecret(value: string, visibleStart = 10, visibleEnd = 6) {
  if (value.length <= visibleStart + visibleEnd) return value;
  return `${value.slice(0, visibleStart)}…${value.slice(-visibleEnd)}`;
}

// ═══════════════════════════════════════════════════════════
// STORAGE (chat-assets bucket)
// ═══════════════════════════════════════════════════════════

const BUCKET = "chat-assets";

export async function uploadChatAsset(userId: string, file: File, folder = "uploads") {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const path = `${userId}/${folder}/${safeName}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listChatAssets(userId: string, folder = "") {
  const path = folder ? `${userId}/${folder}` : userId;
  const { data, error } = await supabase.storage.from(BUCKET).list(path, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function removeChatAsset(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}

export function getChatAssetSignedUrl(path: string) {
  return supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
}

export async function removeAllChatAssets(userId: string, chatId: string) {
  const folder = `${userId}/chat-${chatId}`;
  const { data } = await supabase.storage.from(BUCKET).list(folder, { limit: 500 });
  if (!data || data.length === 0) return;
  const paths = data.map((f) => `${folder}/${f.name}`);
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════
// CLOUD SYNC (Supabase DB)
// ═══════════════════════════════════════════════════════════

type SyncMode = "auto" | "manual";
type SyncStatus = "done" | "loading" | "error";

type SyncSettings = {
  apiKey: string;
  clientAgent: string;
  modelSelectionMode: SyncMode;
};

type SyncMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  status: SyncStatus;
  queuePosition?: number;
  waitTime?: number;
  workerName?: string;
};

type SyncChat = {
  id: string;
  title: string;
  model: string;
  maxLength: number;
  createdAt: number;
  updatedAt: number;
  messages: SyncMessage[];
};

type SyncContext = {
  userId: string;
  email?: string | null;
  settings: SyncSettings;
  chats: SyncChat[];
};

type SettingsRow = {
  user_id: string;
  horde_api_key: string;
  client_agent: string;
  model_selection_mode: SyncMode;
};

type ChatRow = {
  id: string;
  user_id: string;
  title: string;
  model: string;
  max_length: number;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  status: SyncStatus;
  queue_position: number | null;
  wait_time: number | null;
  worker_name: string | null;
  created_at: string;
};

export type ProbeResult = {
  ready: boolean;
  message: string;
};

export type LoadWorkspaceResult = {
  chats: SyncChat[];
  settings: Partial<SyncSettings> | null;
  message: string;
};

function isMissingSchemaError(error: unknown) {
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase();
  const code = String((error as { code?: string } | null)?.code ?? "");
  return code === "42P01" || message.includes("does not exist") || message.includes("could not find the table");
}

function toMillis(value: string | null | undefined) {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function toIso(value: number) {
  return new Date(value).toISOString();
}

export async function probeCloudTables(): Promise<ProbeResult> {
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (!error) {
    return { ready: true, message: "Supabase DB готова к синхронизации." };
  }

  if (isMissingSchemaError(error)) {
    return {
      ready: false,
      message: "Таблицы Supabase еще не созданы. Выполни SQL из supabase/migrations/0001_init.sql в Dashboard.",
    };
  }

  return {
    ready: false,
    message: error.message,
  };
}

export async function loadCloudWorkspace(userId: string): Promise<LoadWorkspaceResult> {
  const [settingsRes, chatsRes, messagesRes] = await Promise.all([
    supabase.from("user_settings").select("user_id,horde_api_key,client_agent,model_selection_mode").eq("user_id", userId).maybeSingle<SettingsRow>(),
    supabase.from("chats").select("id,user_id,title,model,max_length,created_at,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).returns<ChatRow[]>(),
    supabase.from("messages").select("id,chat_id,user_id,role,content,status,queue_position,wait_time,worker_name,created_at").eq("user_id", userId).order("created_at", { ascending: true }).returns<MessageRow[]>(),
  ]);

  const possibleError = settingsRes.error ?? chatsRes.error ?? messagesRes.error;
  if (possibleError) {
    if (isMissingSchemaError(possibleError)) {
      throw new Error("Таблицы Supabase еще не созданы. Выполни SQL-миграцию перед синхронизацией.");
    }
    throw new Error(possibleError.message);
  }

  const settings: Partial<SyncSettings> | null = settingsRes.data
    ? {
        apiKey: settingsRes.data.horde_api_key,
        clientAgent: settingsRes.data.client_agent,
        modelSelectionMode: settingsRes.data.model_selection_mode === "manual" ? "manual" : "auto",
      }
    : null;

  const chatsMap = new Map<string, SyncChat>();
  for (const row of chatsRes.data ?? []) {
    chatsMap.set(row.id, {
      id: row.id,
      title: row.title,
      model: row.model,
      maxLength: row.max_length,
      createdAt: toMillis(row.created_at),
      updatedAt: toMillis(row.updated_at),
      messages: [],
    });
  }

  for (const row of messagesRes.data ?? []) {
    const chat = chatsMap.get(row.chat_id);
    if (!chat) continue;

    chat.messages.push({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: toMillis(row.created_at),
      status: row.status,
      queuePosition: row.queue_position ?? undefined,
      waitTime: row.wait_time ?? undefined,
      workerName: row.worker_name ?? undefined,
    });
  }

  const chats = [...chatsMap.values()].sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    chats,
    settings,
    message: chats.length > 0 ? `Загружено ${chats.length} чатов из Supabase.` : "Облако подключено. История в БД пока пустая.",
  };
}

export async function saveCloudWorkspace(context: SyncContext) {
  const { userId, email, settings, chats } = context;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email: email ?? null,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    if (isMissingSchemaError(profileError)) {
      throw new Error("Таблицы Supabase еще не созданы. Выполни SQL-миграцию перед синхронизацией.");
    }
    throw new Error(profileError.message);
  }

  const { error: settingsError } = await supabase.from("user_settings").upsert({
    user_id: userId,
    horde_api_key: settings.apiKey,
    client_agent: settings.clientAgent,
    model_selection_mode: settings.modelSelectionMode,
    updated_at: new Date().toISOString(),
  });

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const { error: deleteChatsError } = await supabase.from("chats").delete().eq("user_id", userId);
  if (deleteChatsError) {
    throw new Error(deleteChatsError.message);
  }

  if (chats.length > 0) {
    const chatRows = chats.map((chat) => ({
      id: chat.id,
      user_id: userId,
      title: chat.title,
      model: chat.model,
      max_length: chat.maxLength,
      created_at: toIso(chat.createdAt),
      updated_at: toIso(chat.updatedAt),
    }));

    const { error: chatsInsertError } = await supabase.from("chats").insert(chatRows);
    if (chatsInsertError) {
      throw new Error(chatsInsertError.message);
    }

    const messageRows = chats.flatMap((chat) =>
      chat.messages.map((message) => ({
        id: message.id,
        chat_id: chat.id,
        user_id: userId,
        role: message.role,
        content: message.content,
        status: message.status,
        queue_position: message.queuePosition ?? null,
        wait_time: message.waitTime ?? null,
        worker_name: message.workerName ?? null,
        created_at: toIso(message.createdAt),
      })),
    );

    if (messageRows.length > 0) {
      const { error: messagesInsertError } = await supabase.from("messages").insert(messageRows);
      if (messagesInsertError) {
        throw new Error(messagesInsertError.message);
      }
    }
  }

  return {
    message: `Синхронизировано ${chats.length} чатов и сохранены настройки пользователя.`,
  };
}

// ═══════════════════════════════════════════════════════════
// HORDE PROXY (Edge Function + direct fallback)
// ═══════════════════════════════════════════════════════════

type ProxyAction = "models" | "text-async" | "text-status" | "image-models" | "image-async" | "image-status";

type ProxyOptions = {
  apiKey?: string;
  clientAgent?: string;
};

type ProxyEnvelope<T> = {
  ok?: boolean;
  action?: ProxyAction;
  data?: T;
  error?: string;
};

export type ProxyTextStatus = {
  done?: boolean;
  faulted?: boolean;
  queue_position?: number;
  wait_time?: number;
  generations?: { text: string; worker_name?: string }[];
};

export type TransportMode = "proxy" | "direct";

const HORDE_BASES = ["https://aihorde.net/api/v2", "https://stablehorde.net/api/v2"];

let currentTransport: TransportMode = "proxy";
let proxyAvailable: boolean | null = null;

export function getTransportMode(): TransportMode {
  return currentTransport;
}

export function getTransportLabel(): string {
  if (proxyAvailable === null) return "определяется...";
  return currentTransport === "proxy" ? "Edge Function (proxy)" : "Direct Horde API (fallback)";
}

// ─── Edge Function invoke ───
async function invokeProxy<T>(action: ProxyAction, payload: Record<string, unknown>, options: ProxyOptions = {}): Promise<T | undefined> {
  const { data, error } = await supabase.functions.invoke<ProxyEnvelope<T>>("horde-proxy", {
    body: { action, ...payload },
    headers: {
      ...(options.apiKey ? { "x-horde-api-key": options.apiKey } : {}),
      ...(options.clientAgent ? { "x-client-agent": options.clientAgent } : {}),
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || "Edge Function вернула пустой ответ.");
  return data.data;
}

// ─── Direct Horde fetch ───
async function hordeFetchDirect(path: string, init: RequestInit = {}, auth?: { apiKey?: string; clientAgent?: string }) {
  let lastError: Error | null = null;

  for (const base of HORDE_BASES) {
    try {
      const hasBody = typeof init.body !== "undefined";
      const response = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
          ...(auth?.apiKey ? { apikey: auth.apiKey } : {}),
          ...(auth?.clientAgent ? { "Client-Agent": auth.clientAgent } : {}),
          ...(init.headers as Record<string, string> ?? {}),
        },
      });

      const text = response.status === 204 ? "" : await response.text();

      if (!response.ok) {
        const msg = response.status === 400 ? "Ошибка 400: проверь параметры запроса."
          : response.status === 401 ? "Ошибка 401: невалидный API key."
          : response.status === 429 ? "Ошибка 429: rate limit."
          : response.status === 503 ? "Ошибка 503: Horde временно недоступен."
          : `Horde error ${response.status}`;
        throw new Error(msg);
      }

      if (!text) return null;

      const parsed = JSON.parse(text);
      if (typeof parsed === "string" && parsed.includes("<!doctype")) {
        throw new Error("Horde вернул HTML вместо JSON.");
      }
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Horde request failed.");
    }
  }

  throw lastError ?? new Error("Все Horde endpoints недоступны.");
}

// ─── Smart fetch: try proxy first, fallback to direct ───
async function smartFetch<T>(
  action: ProxyAction,
  proxyPayload: Record<string, unknown>,
  directPath: string,
  directInit: RequestInit,
  options: ProxyOptions,
): Promise<T> {
  // If proxy was already confirmed broken, go direct
  if (proxyAvailable === false) {
    console.info(`[HordeProxy] Direct: ${action}`);
    const result = await hordeFetchDirect(directPath, directInit, {
      apiKey: options.apiKey,
      clientAgent: options.clientAgent,
    });
    return result as T;
  }

  // Try proxy
  try {
    const result = await invokeProxy<T>(action, proxyPayload, options);
    if (proxyAvailable !== true) {
      proxyAvailable = true;
      currentTransport = "proxy";
      console.info("[HordeProxy] Edge Function доступна.");
    }
    return result as T;
  } catch (proxyError) {
    // First failure — mark proxy as broken, switch to direct
    if (proxyAvailable === null || proxyAvailable === true) {
      proxyAvailable = false;
      currentTransport = "direct";
      console.warn("[HordeProxy] Edge Function недоступна, переключаюсь на прямой Horde API.", proxyError);
      console.error("[HordeProxy] Proxy fallback error:", proxyError);
    }

    console.info(`[HordeProxy] Fallback direct: ${action}`);
    const result = await hordeFetchDirect(directPath, directInit, {
      apiKey: options.apiKey,
      clientAgent: options.clientAgent,
    });
    return result as T;
  }
}

// ─── Retry proxy periodically ───
let retryTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleProxyRetry(intervalMs = 30000) {
  if (retryTimer) return;
  retryTimer = setInterval(() => {
    if (proxyAvailable === false) {
      proxyAvailable = null; // allow next call to try proxy again
    }
  }, intervalMs);
}

// ─── Public API — Text ───

export function loadTextModelsViaProxy(options: ProxyOptions = {}) {
  return smartFetch<unknown[]>(
    "models",
    {},
    "/status/models?type=text",
    { method: "GET" },
    options,
  );
}

export function createTextJobViaProxy(payload: Record<string, unknown>, options: ProxyOptions) {
  return smartFetch<{ id?: string }>(
    "text-async",
    { request: payload },
    "/generate/text/async",
    { method: "POST", body: JSON.stringify(payload) },
    options,
  );
}

export function getTextJobStatusViaProxy(jobId: string, options: ProxyOptions) {
  return smartFetch<ProxyTextStatus>(
    "text-status",
    { id: jobId },
    `/generate/text/status/${jobId}`,
    { method: "GET" },
    options,
  );
}

// ─── Public API — Image ───

export type ProxyImageStatus = {
  done?: boolean;
  faulted?: boolean;
  queue_position?: number;
  wait_time?: number;
  generations?: { img: string; seed: string; worker_name: string }[];
};

export function loadImageModelsViaProxy(options: ProxyOptions = {}) {
  return smartFetch<unknown[]>(
    "image-models",
    {},
    "/status/models?type=image",
    { method: "GET" },
    options,
  );
}

export function createImageJobViaProxy(payload: Record<string, unknown>, options: ProxyOptions) {
  return smartFetch<{ id?: string }>(
    "image-async",
    { request: payload },
    "/generate/async",
    { method: "POST", body: JSON.stringify(payload) },
    options,
  );
}

export function getImageJobStatusViaProxy(jobId: string, options: ProxyOptions) {
  return smartFetch<ProxyImageStatus>(
    "image-status",
    { id: jobId },
    `/generate/status/${jobId}`,
    { method: "GET" },
    options,
  );
}
