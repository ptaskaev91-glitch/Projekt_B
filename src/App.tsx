import { ChangeEvent, FormEvent, lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import {
  SETTINGS_KEY,
  CHATS_KEY,
  ACTIVE_CHAT_KEY,
  DEFAULT_SETTINGS,
  getDefaultChat,
  normalizeChat,
} from "./types";
import type { ChatAsset, ChatSession, HordeSettings } from "./types";

import {
  dispatch as dispatchAction,
  type ActionHandlers,
  type DispatchRuntimeContext,
} from "../core/actions/dispatch";
import { handlers as coreHandlers } from "../core/handlers";
import { selectors, type AppState } from "../core/state";
import { modelsActionTypes } from "../modules/models";

import { useAuth, useModels } from "./hooks";

// Lazy loaded components
const Sidebar = lazy(() => import("./Sidebar").then(m => ({ default: m.Sidebar })));
const ChatArea = lazy(() => import("./ChatArea").then(m => ({ default: m.ChatArea })));
const ModelsPanel = lazy(() => import("../modules/models/ui/ModelsPanel").then(m => ({ default: m.ModelsPanel })));

function FallbackImagePanel() {
  return (
    <div className="p-4 text-sm text-zinc-400 bg-[#11131a] border-t border-zinc-800/80">
      Image module недоступен (disabled).
    </div>
  );
}

const ImagePanel = lazy(() =>
  import("../modules/image/ui/ImagePanel")
    .then(m => ({ default: m.ImagePanel }))
    .catch(() => ({ default: FallbackImagePanel }))
);

const SettingsPanel = lazy(() => import("./Panels").then(m => ({ default: m.SettingsPanel })));

export function App() {
  // Settings
  const [settings, setSettings] = useState<HordeSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    try {
      const p = JSON.parse(saved) as Partial<HordeSettings>;
      return { ...DEFAULT_SETTINGS, ...p };
    } catch { return DEFAULT_SETTINGS; }
  });

  // Chats
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(CHATS_KEY);
    if (!saved) return [getDefaultChat()];
    try {
      const parsed = JSON.parse(saved) as Partial<ChatSession>[];
      const n = Array.isArray(parsed) ? parsed.map((c) => normalizeChat(c)) : [];
      return n.length > 0 ? n : [getDefaultChat()];
    } catch { return [getDefaultChat()]; }
  });

  const [activeChatId, setActiveChatId] = useState<string>(() => localStorage.getItem(ACTIVE_CHAT_KEY) ?? "");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; kind: "info" | "warn" | "error" }[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [assets, setAssets] = useState<ChatAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [imageJobs, setImageJobs] = useState<NonNullable<AppState["imageJobs"]>>([]);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<AppState["cloudStatus"]>("idle");
  const [cloudMessage, setCloudMessage] = useState("Войдите для облачной синхронизации");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [conflictData, setConflictData] = useState<AppState["conflictData"]>(null);
  const [cloudLoadedUserId, setCloudLoadedUserId] = useState("");
  const lastCloudSnapshotRef = useRef("");
  const stateRef = useRef<AppState | null>(null);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else if (settings.theme === "dark") {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("light", !prefersDark);
      root.classList.toggle("dark", prefersDark);
    }
  }, [settings.theme]);

  // Persist (debounced)
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), 300);
    return () => clearTimeout(t);
  }, [settings]);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(CHATS_KEY, JSON.stringify(chats)), 300);
    return () => clearTimeout(t);
  }, [chats]);
  useEffect(() => {
    if (!activeChatId && chats[0]) { setActiveChatId(chats[0].id); return; }
    if (activeChatId && !chats.some((c) => c.id === activeChatId) && chats[0]) setActiveChatId(chats[0].id);
  }, [activeChatId, chats]);
  useEffect(() => { if (activeChatId) localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId); }, [activeChatId]);

  // Toast helper
  const pushToast = useCallback((message: string, kind: "info" | "warn" | "error" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text: message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event.reason instanceof Error ? event.reason.message : "Необработанная ошибка";
      pushToast(msg, "error");
    };
    window.addEventListener("unhandledrejection", handler);
    const offline = () => pushToast("Соединение потеряно (offline)", "warn");
    const online = () => pushToast("Соединение восстановлено", "info");
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("unhandledrejection", handler);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, [pushToast]);

  const viewState: AppState = {
    chats,
    settings,
    activeChatId,
    validationErrors,
    assets,
    assetsLoading,
    assetsError,
    imageJobs,
    imageGenerating,
    cloudStatus,
    cloudMessage,
    lastSyncTime,
    conflictData,
  };
  stateRef.current = viewState;
  const activeChat = selectors.activeChat(viewState);
  const contextUsage = selectors.contextUsage(viewState);
  const contextPercent = Math.min(100, Math.round((contextUsage / settings.maxContextTokens) * 100));

  // Core dispatch handlers (Phase 2: via core/handlers)
  const dispatch = useCallback((type: string, payload?: unknown) => {
    const setState = (producer: (draft: AppState) => void) => {
      const current = stateRef.current ?? viewState;
      const draft: AppState = {
        ...current,
        chats: [...current.chats],
        settings: { ...current.settings },
        validationErrors: [...current.validationErrors],
        assets: [...current.assets],
        imageJobs: [...(current.imageJobs ?? [])],
        conflictData: current.conflictData
          ? {
              localChats: [...current.conflictData.localChats],
              cloudChats: [...current.conflictData.cloudChats],
              localSettings: { ...current.conflictData.localSettings },
              cloudSettings: current.conflictData.cloudSettings ? { ...current.conflictData.cloudSettings } : null,
            }
          : null,
      };
      producer(draft);
      stateRef.current = draft;
      setChats(draft.chats);
      setSettings(draft.settings);
      setActiveChatId(draft.activeChatId);
      setValidationErrors(draft.validationErrors);
      setAssets(draft.assets);
      setAssetsLoading(draft.assetsLoading);
      setAssetsError(draft.assetsError);
      setImageJobs(draft.imageJobs ?? []);
      setImageGenerating(draft.imageGenerating ?? false);
      setCloudStatus(draft.cloudStatus ?? "idle");
      setCloudMessage(draft.cloudMessage ?? "");
      setLastSyncTime(draft.lastSyncTime ?? null);
      setConflictData(draft.conflictData ?? null);
    };
    const getState = (): AppState => stateRef.current ?? viewState;

    const handlersWithCtx = Object.fromEntries(
      Object.entries(coreHandlers).map(([registeredType, handler]) => [
        registeredType,
        (pl: unknown, runtime: DispatchRuntimeContext) => {
          let stateUpdateCount = 0;
          const tracedSetState = (producer: (draft: AppState) => void) => {
            setState(producer);
            stateUpdateCount += 1;
            runtime.log(
              "state.update",
              { handler: registeredType, stateUpdateCount },
              "debug",
            );
          };

          runtime.log("handler.start", { handler: registeredType }, "debug");

          return Promise.resolve(
            handler(pl, {
              setState: tracedSetState,
              getState,
              traceId: runtime.traceId,
              actionType: registeredType,
              log: (event, details, level = "info") => {
                runtime.log(
                  event,
                  {
                    handler: registeredType,
                    ...(details ?? {}),
                  },
                  level,
                );
              },
            }),
          )
            .then((result) => {
              runtime.log(
                "handler.end",
                { handler: registeredType, stateUpdateCount },
                "debug",
              );
              return result;
            })
            .catch((error) => {
              runtime.log(
                "handler.error",
                {
                  handler: registeredType,
                  stateUpdateCount,
                  message: error instanceof Error ? error.message : String(error),
                },
                "error",
              );
              throw error;
            });
        },
      ]),
    ) as ActionHandlers;

    return dispatchAction({ type, payload }, handlersWithCtx);
  }, [viewState]);

  // Auth
  const auth = useAuth();

  // Models
  const models = useModels(settings, activeChat?.model);

  // Validate settings via core handler
  useEffect(() => {
    dispatch("settings/validate");
  }, [settings, dispatch]);

  // Assets auto-load on chat/session change
  useEffect(() => {
    if (!auth.session?.user?.id || !activeChat) {
      setAssets([]);
      setAssetsError(auth.session ? "" : "Войдите для Storage.");
      return;
    }
    dispatch("assets/list", { userId: auth.session.user.id, chatId: activeChat.id });
  }, [auth.session?.user?.id, activeChat?.id, dispatch]);

  useEffect(() => {
    if (auth.session?.user) return;
    setCloudLoadedUserId("");
    setCloudStatus("idle");
    setCloudMessage("Войдите для облачной синхронизации");
    setConflictData(null);
    setLastSyncTime(null);
    lastCloudSnapshotRef.current = "";
  }, [auth.session?.user]);

  useEffect(() => {
    const userId = auth.session?.user?.id;
    if (!userId || cloudLoadedUserId === userId) return;
    let cancelled = false;

    const loadCloud = async () => {
      const ready = await dispatch("cloud/probe");
      if (cancelled || !ready) return;
      await dispatch("cloud/load", {
        userId,
        chats,
        settings,
      });
      if (!cancelled) {
        setCloudLoadedUserId(userId);
      }
    };

    void loadCloud();
    return () => {
      cancelled = true;
    };
  }, [auth.session?.user?.id, cloudLoadedUserId, chats, dispatch, settings]);

  useEffect(() => {
    if (!auth.session?.user?.id || cloudLoadedUserId !== auth.session.user.id) return;
    if (cloudStatus === "conflict" || cloudStatus === "checking" || cloudStatus === "schema-missing") return;

    const snapshot = JSON.stringify({ chats, settings });
    if (snapshot === lastCloudSnapshotRef.current) return;

    const tid = window.setTimeout(() => {
      void dispatch("cloud/save", {
        userId: auth.session?.user?.id,
        email: auth.session?.user?.email ?? null,
      });
      lastCloudSnapshotRef.current = snapshot;
    }, 900);

    return () => window.clearTimeout(tid);
  }, [auth.session?.user?.email, auth.session?.user?.id, chats, cloudLoadedUserId, cloudStatus, dispatch, settings]);

  const lastSyncLabel = lastSyncTime ? `Синхр: ${new Date(lastSyncTime).toLocaleTimeString()}` : null;

  function createChat() {
    dispatch("chat/create");
  }

  function deleteChat(chatId: string) {
    if (auth.session?.user?.id) {
      dispatch("assets/cleanup", { userId: auth.session.user.id, chatId });
    }
    dispatch("chat/delete", { chatId });
  }

  function renameChat(chatId: string, title: string) {
    dispatch("chat/rename", { chatId, title });
  }

  function selectModel(name: string) {
    if (!activeChat) return;
    dispatch(modelsActionTypes.select, { chatId: activeChat.id, model: name });
  }

  function exportChat(chat: ChatSession) {
    const blob = new Blob([JSON.stringify(chat, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `horde-chat-${chat.id}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportAllChats() {
    const blob = new Blob([JSON.stringify({ chats, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `horde-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importChats(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      dispatch("chat/import", { raw: e.target?.result as string });
    };
    reader.readAsText(file);
  }

  function insertAssetIntoInput(asset: ChatAsset) {
    const line = `Файл: ${asset.name}${asset.url ? ` — ${asset.url}` : ""}`;
    setInput((prev) => `${prev.trimEnd()}${prev.trim() ? "\n\n" : ""}${line}`);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!activeChat || sending) return;
    const userText = input.trim();
    if (!userText) return;

    if (validationErrors.length > 0) {
      const msg = validationErrors[0];
      setGlobalError(msg);
      pushToast(msg);
      return;
    }
    setSending(true); setGlobalError(""); setInput("");
    try {
      await dispatch("chat/sendMessage", {
        userText,
        chatId: activeChat.id,
        effectiveModelName: models.effectiveModelName,
      });
    } finally {
      setSending(false);
    }
  }

  const loadingFallback = <div className="flex items-center justify-center h-full text-gray-400">Загрузка...</div>;

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${
              t.kind === "error"
                ? "border-rose-500/40 bg-rose-500/15 text-rose-50"
                : t.kind === "warn"
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-50"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-50"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      <Suspense fallback={loadingFallback}>
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onUpdate={(next) => dispatch("settings/update", { partial: next })}
            onClose={() => setShowSettings(false)}
          />
        )}
      </Suspense>

      {/* Conflict Resolution Modal */}
      {cloudStatus === "conflict" && conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-lg bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">⚠️ Конфликт синхронизации</h3>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Найдены данные и локально, и в облаке. Что использовать?
            </p>
            <div className="mb-4 space-y-2 text-sm">
              <div className="rounded bg-[var(--bg-primary)] p-2">
                <strong>Локально:</strong> {conflictData.localChats.length} чатов
              </div>
              <div className="rounded bg-[var(--bg-primary)] p-2">
                <strong>В облаке:</strong> {conflictData.cloudChats.length} чатов
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void dispatch("cloud/resolve", { choice: "cloud" })}
                className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                ☁️ Облако
              </button>
              <button
                onClick={() => void dispatch("cloud/resolve", { choice: "local" })}
                className="flex-1 rounded bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                💾 Локально
              </button>
              <button
                onClick={() => void dispatch("cloud/resolve", { choice: "merge" })}
                className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                🔀 Слить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid min-h-screen max-w-[1800px] grid-cols-1 bg-[var(--bg-primary)] xl:grid-cols-[290px_minmax(0,1fr)_440px]">
        <Suspense fallback={loadingFallback}>
          <Sidebar
            chats={chats}
            activeChat={activeChat}
            settings={settings}
            supabaseStatus={auth.supabaseStatus}
            cloudStatus={cloudStatus ?? "idle"}
            cloudMessage={cloudMessage}
            lastSyncLabel={lastSyncLabel}
            sessionEmail={auth.session?.user?.email ?? null}
            sessionUser={!!auth.session?.user}
            authEmail={auth.authEmail}
            authLoading={auth.authLoading}
            authMessage={auth.authMessage}
            onSetAuthEmail={auth.setAuthEmail}
            onSendMagicLink={() => void auth.sendMagicLink()}
            onSignOut={() => void auth.signOut()}
            onCreateChat={createChat}
            onSelectChat={(id) => dispatch("chat/setActive", { chatId: id })}
            onDeleteChat={deleteChat}
            onRenameChat={renameChat}
            onExportChat={exportChat}
            onExportAll={exportAllChats}
            onImportChats={importChats}
            onUpdateSettings={(partial) => dispatch("settings/update", { partial })}
            onUpdateMaxLength={(v) => {
              if (activeChat) {
                dispatch("chat/setMaxLength", { chatId: activeChat.id, maxLength: v });
              }
            }}
            maxLength={activeChat?.maxLength ?? 400}
          />
        </Suspense>
        <Suspense fallback={loadingFallback}>
          <ChatArea
            activeChat={activeChat}
            settings={settings}
            effectiveModelName={models.effectiveModelName}
            transportLabel={models.transportLabel}
            supabaseStatus={auth.supabaseStatus}
            cloudStatus={cloudStatus ?? "idle"}
            cloudMessage={cloudMessage}
            sessionEmail={auth.session?.user?.email ?? null}
            input={input}
            sending={sending}
            globalError={globalError}
            assets={assets}
            assetsLoading={assetsLoading}
            assetsUploading={assetsLoading}
            assetsError={assetsError}
            sessionUser={!!auth.session?.user}
            contextUsage={contextUsage}
            contextPercent={contextPercent}
            validationErrors={validationErrors}
            onSetInput={setInput}
            onSendMessage={sendMessage}
            onFileSelected={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file || !auth.session?.user?.id || !activeChat) return;
              if (file.size > 10 * 1024 * 1024) { setAssetsError("Файл слишком большой. Максимум 10 МБ."); return; }
              dispatch("assets/upload", { userId: auth.session.user.id, chatId: activeChat.id, file });
            }}
            onRemoveAsset={(path) => {
              if (!auth.session?.user?.id || !activeChat) return;
              dispatch("assets/remove", { userId: auth.session.user.id, chatId: activeChat.id, path });
            }}
            onInsertAsset={insertAssetIntoInput}
          />
        </Suspense>
        <Suspense fallback={loadingFallback}>
          <div className="flex flex-col">
            <ModelsPanel
              state={{
                settings,
                filteredModels: models.filteredModels,
                effectiveModel: models.effectiveModel,
                effectiveModelName: models.effectiveModelName,
                modelsLoading: models.modelsLoading,
                modelsError: models.modelsError,
                modelFilter: models.modelFilter,
                lastModelsRefresh: models.lastModelsRefresh,
                activeChatModel: activeChat?.model,
              }}
              actions={{
                onSetModelFilter: models.setModelFilter,
                onLoadModels: () => void models.loadModels(),
                onSelectModel: selectModel,
              }}
            />
            <ImagePanel
              state={{ imageJobs, imageGenerating }}
              actions={{
                onGenerate: (params) => void dispatch("image/generate", params),
                onRemoveJob: (id) => void dispatch("image/removeJob", { id }),
                onClearJobs: () => void dispatch("image/clearJobs"),
              }}
            />
          </div>
        </Suspense>
      </div>
    </main>
  );
}

export default App;
