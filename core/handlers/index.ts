import { getDefaultChat, normalizeChat } from "../../src/types";
import type { ChatSession, ChatAsset, HordeSettings } from "../../src/types";
import { buildPromptWithContext, uid, wait } from "../../src/types";
import {
  createTextJobViaProxy,
  getTextJobStatusViaProxy,
  listChatAssets,
  getChatAssetSignedUrl,
  uploadChatAsset,
  removeChatAsset,
  removeAllChatAssets,
  probeCloudTables,
  loadCloudWorkspace,
  saveCloudWorkspace,
} from "../../src/lib";
import type { HandlerMap } from "./types";
import { imageHandlers } from "../../modules/image/handlers";
import { modelsHandlers } from "../../modules/models/handlers";

export const handlers: HandlerMap = {
  "chat/create": (_payload, ctx) => {
    ctx.setState((draft) => {
      const fresh = getDefaultChat();
      draft.chats = [fresh, ...draft.chats];
      draft.activeChatId = fresh.id;
    });
  },
  "chat/delete": (payload, ctx) => {
    const { chatId } = (payload ?? {}) as { chatId?: string };
    if (!chatId) return;
    ctx.setState((draft) => {
      draft.chats = draft.chats.filter((c) => c.id !== chatId);
      if (draft.chats.length === 0) {
        const fresh = getDefaultChat();
        draft.chats = [fresh];
        draft.activeChatId = fresh.id;
      } else if (!draft.chats.some((c) => c.id === draft.activeChatId)) {
        draft.activeChatId = draft.chats[0].id;
      }
    });
  },
  "chat/rename": (payload, ctx) => {
    const { chatId, title } = (payload ?? {}) as { chatId?: string; title?: string };
    if (!chatId || !title) return;
    ctx.setState((draft) => {
      draft.chats = draft.chats.map((c) => (c.id === chatId ? { ...c, title, updatedAt: Date.now() } : c));
    });
  },
  "chat/setMaxLength": (payload, ctx) => {
    const { chatId, maxLength } = (payload ?? {}) as { chatId?: string; maxLength?: number };
    if (!chatId || typeof maxLength !== "number") return;
    ctx.setState((draft) => {
      draft.chats = draft.chats.map((c) => (c.id === chatId ? { ...c, maxLength, updatedAt: Date.now() } : c));
    });
  },
  "chat/setActive": (payload, ctx) => {
    const { chatId } = (payload ?? {}) as { chatId?: string };
    if (!chatId) return;
    ctx.setState((draft) => { draft.activeChatId = chatId; });
  },
  "chat/import": (payload, ctx) => {
    const { raw } = (payload ?? {}) as { raw?: unknown };
    if (!raw) return;
    ctx.setState((draft) => {
      try {
        const json = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (json && (json as ChatSession).messages) {
          const imported = { ...getDefaultChat(), ...json, id: crypto.randomUUID?.() ?? String(Date.now()) } as ChatSession;
          draft.chats = [imported, ...draft.chats];
          draft.activeChatId = imported.id;
          return;
        }
        if (Array.isArray((json as { chats?: ChatSession[] }).chats)) {
          const arr = (json as { chats: ChatSession[] }).chats.map((c) => ({ ...c, id: crypto.randomUUID?.() ?? String(Date.now()) }));
          if (arr.length > 0) {
            draft.chats = [...arr, ...draft.chats];
            draft.activeChatId = arr[0].id;
          }
          return;
        }
      } catch {
        // invalid import ignored
      }
    });
  },
  "settings/validate": (_payload, ctx) => {
    ctx.setState((draft) => {
      const errs: string[] = [];
      if (!draft.settings.apiKey?.trim()) errs.push("Укажи Horde API key в настройках.");
      if (draft.settings.maxContextTokens < 512) errs.push("Max context tokens должен быть ≥ 512.");
      draft.validationErrors = errs;
    });
  },
  "settings/update": (payload, ctx) => {
    const { partial } = (payload ?? {}) as { partial?: Partial<HordeSettings> };
    if (!partial) return;
    ctx.setState((draft) => {
      draft.settings = { ...draft.settings, ...partial };
    });
  },
  "chat/sendMessage": async (payload, ctx) => {
    const { userText, chatId, effectiveModelName } = (payload ?? {}) as {
      userText?: string;
      chatId?: string;
      effectiveModelName?: string;
    };
    if (!userText || !chatId) {
      ctx.log("chat.send.invalid_payload", { hasUserText: Boolean(userText), hasChatId: Boolean(chatId) }, "warn");
      return;
    }
    const state = ctx.getState();
    const chat = state.chats.find((c) => c.id === chatId);
    if (!chat) {
      ctx.log("chat.send.chat_not_found", { chatId }, "warn");
      return;
    }

    ctx.setState((draft) => {
      const userMsg = { id: uid(), role: "user" as const, content: userText, createdAt: Date.now(), status: "done" as const };
      const assistantMsg = { id: uid(), role: "assistant" as const, content: "Генерирую...", createdAt: Date.now(), status: "loading" as const };
      draft.chats = draft.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: c.messages.length === 0 ? userText.slice(0, 42) : c.title,
              updatedAt: Date.now(),
              messages: [...c.messages, userMsg, assistantMsg],
            }
          : c
      );
    });

    try {
      const { settings } = ctx.getState();
      const preset = settings.presets.find((p) => p.id === settings.activePresetId) ?? settings.presets[0];
      const { prompt } = buildPromptWithContext(chat, userText, settings.systemPrompt, settings.maxContextTokens);
      const modelToUse = effectiveModelName || chat.model || "aphrodite";
      ctx.log("chat.send.job_create", { chatId, model: modelToUse }, "info");

      const create = await createTextJobViaProxy({
        prompt,
        models: [modelToUse],
        params: {
          max_length: preset?.maxLength ?? 400,
          temperature: preset?.temperature ?? 0.8,
          top_p: preset?.topP ?? 0.9,
          top_k: preset?.topK ?? 50,
          rep_pen: preset?.repetitionPenalty ?? 1.05,
        }
      }, { apiKey: settings.apiKey, clientAgent: settings.clientAgent });

      if (!create?.id) throw new Error("Не получен id задачи.");
      ctx.log("chat.send.job_created", { chatId, jobId: create.id }, "debug");

      for (let i = 0; i < 90; i++) {
        const status = await getTextJobStatusViaProxy(create.id, { apiKey: settings.apiKey, clientAgent: settings.clientAgent });
        ctx.setState((draft) => {
          draft.chats = draft.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) =>
                    m.id === c.messages[c.messages.length - 1].id
                      ? { ...m, queuePosition: status.queue_position, waitTime: status.wait_time }
                      : m
                  ),
                }
              : c
          );
        });
        if (status.done && Array.isArray(status.generations) && status.generations[0]) {
          const gen = status.generations[0];
          ctx.log("chat.send.job_done", { chatId, worker: gen.worker_name ?? null }, "info");
          ctx.setState((draft) => {
            draft.chats = draft.chats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    updatedAt: Date.now(),
                    messages: c.messages.map((m, idx) =>
                      idx === c.messages.length - 1 ? { ...m, status: "done", content: gen.text, workerName: gen.worker_name } : m
                    ),
                  }
                : c
            );
          });
          return;
        }
        if (status.faulted) {
          ctx.log("chat.send.job_faulted", { chatId, jobId: create.id }, "warn");
          throw new Error("Задача завершилась с ошибкой на Horde.");
        }
        await wait(2500);
      }
      ctx.log("chat.send.job_timeout", { chatId, jobId: create.id }, "warn");
      throw new Error("Таймаут ожидания.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      ctx.log("chat.send.error", { chatId, message: msg }, "error");
      ctx.setState((draft) => {
        draft.chats = draft.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m, idx) =>
                  idx === c.messages.length - 1 ? { ...m, status: "error" as const, content: msg } : m
                ),
              }
            : c
        );
        draft.validationErrors = [...draft.validationErrors, msg];
      });
    }
  },
  ...imageHandlers,
  ...modelsHandlers,
  "assets/list": async (payload, ctx) => {
    const { userId, chatId } = (payload ?? {}) as { userId?: string; chatId?: string };
    if (!userId || !chatId) return;
    ctx.setState((draft) => { draft.assetsLoading = true; draft.assetsError = ""; });
    try {
      const folder = `chat-${chatId}`;
      const rows = await listChatAssets(userId, folder);
      const next: ChatAsset[] = await Promise.all(
        rows.filter((i) => Boolean(i.name)).map(async (i) => {
          const path = `${userId}/${folder}/${i.name}`;
          const signed = await getChatAssetSignedUrl(path);
          return { name: i.name, path, url: signed.data?.signedUrl ?? null, createdAt: "created_at" in i && typeof i.created_at === "string" ? i.created_at : null } as ChatAsset;
        }),
      );
      ctx.setState((draft) => { draft.assets = next; draft.assetsLoading = false; });
    } catch (e) {
      ctx.setState((draft) => { draft.assetsError = e instanceof Error ? e.message : "Ошибка загрузки файлов"; draft.assetsLoading = false; });
    }
  },
  "assets/upload": async (payload, ctx) => {
    const { userId, chatId, file } = (payload ?? {}) as { userId?: string; chatId?: string; file?: File };
    if (!userId || !chatId || !file) return;
    ctx.setState((draft) => { draft.assetsLoading = true; draft.assetsError = ""; });
    try {
      await uploadChatAsset(userId, file, `chat-${chatId}`);
      await handlers["assets/list"]({ userId, chatId }, ctx);
    } catch (e) {
      ctx.setState((draft) => { draft.assetsError = e instanceof Error ? e.message : "Ошибка загрузки файла"; });
    } finally {
      ctx.setState((draft) => { draft.assetsLoading = false; });
    }
  },
  "assets/remove": async (payload, ctx) => {
    const { path, userId, chatId } = (payload ?? {}) as { path?: string; userId?: string; chatId?: string };
    if (!path || !userId || !chatId) return;
    ctx.setState((draft) => { draft.assetsLoading = true; draft.assetsError = ""; });
    try {
      await removeChatAsset(path);
      await handlers["assets/list"]({ userId, chatId }, ctx);
    } catch (e) {
      ctx.setState((draft) => { draft.assetsError = e instanceof Error ? e.message : "Ошибка удаления файла"; });
    } finally {
      ctx.setState((draft) => { draft.assetsLoading = false; });
    }
  },
  "assets/cleanup": async (payload) => {
    const { userId, chatId } = (payload ?? {}) as { userId?: string; chatId?: string };
    if (!userId || !chatId) return;
    try { await removeAllChatAssets(userId, chatId); } catch { /* ignore */ }
  },
  "cloud/probe": async (_payload, ctx) => {
    ctx.setState((draft) => { draft.cloudStatus = "checking"; draft.cloudMessage = "Проверяю DB..."; });
    try {
      const probe = await probeCloudTables();
      if (!probe.ready) {
        ctx.setState((draft) => { draft.cloudStatus = "schema-missing"; draft.cloudMessage = probe.message; });
        return false;
      }
      ctx.setState((draft) => { draft.cloudStatus = "ready"; draft.cloudMessage = "Supabase готов"; });
      return true;
    } catch (e) {
      ctx.setState((draft) => { draft.cloudStatus = "error"; draft.cloudMessage = e instanceof Error ? e.message : "Ошибка probe"; });
      return false;
    }
  },
  "cloud/load": async (payload, ctx) => {
    const { userId, chats, settings } = (payload ?? {}) as { userId?: string; chats: ChatSession[]; settings: HordeSettings };
    if (!userId) return;
    ctx.log("cloud.load.start", { userId, localChats: chats.length }, "info");
    ctx.setState((draft) => { draft.cloudStatus = "checking"; draft.cloudMessage = "Загружаю..."; });
    try {
      const ws = await loadCloudWorkspace(userId);
      const hasLocal = chats.length > 0 && chats.some((c) => c.messages.length > 0);
      const hasCloud = ws.chats.length > 0;
      if (hasLocal && hasCloud) {
        const normalizedCloud = ws.chats.map((c) => normalizeChat(c));
        const localNewest = Math.max(...chats.map((c) => c.updatedAt));
        const cloudNewest = Math.max(...normalizedCloud.map((c) => c.updatedAt));
        if (cloudNewest > localNewest + 60000) {
          ctx.log("cloud.load.conflict", { userId, localChats: chats.length, cloudChats: normalizedCloud.length }, "warn");
          ctx.setState((draft) => {
            draft.cloudStatus = "conflict";
            draft.cloudMessage = `Конфликт: локально ${chats.length}, в облаке ${normalizedCloud.length}`;
            draft.conflictData = { localChats: chats, cloudChats: normalizedCloud, localSettings: settings, cloudSettings: ws.settings };
          });
          return;
        }
      }
      ctx.log("cloud.load.success", { userId, cloudChats: ws.chats.length, hasSettings: Boolean(ws.settings) }, "info");
      ctx.setState((draft) => {
        if (ws.settings) draft.settings = { ...draft.settings, ...ws.settings };
        if (hasCloud) {
          const normalizedCloud = ws.chats.map((c) => normalizeChat(c));
          const cloudIds = new Set(normalizedCloud.map((c) => c.id));
          const uniqueLocal = chats.filter((c) => !cloudIds.has(c.id) && c.messages.length > 0);
          draft.chats = [...normalizedCloud, ...uniqueLocal].sort((a, b) => b.updatedAt - a.updatedAt);
          draft.activeChatId = draft.chats[0]?.id ?? draft.activeChatId;
        }
        draft.cloudStatus = "ready";
        draft.lastSyncTime = Date.now();
        draft.cloudMessage = ws.message;
      });
    } catch (e) {
      ctx.log("cloud.load.error", { userId, message: e instanceof Error ? e.message : String(e) }, "error");
      ctx.setState((draft) => { draft.cloudStatus = "error"; draft.cloudMessage = e instanceof Error ? e.message : "Ошибка загрузки облака"; });
    }
  },
  "cloud/resolve": (payload, ctx) => {
    const { choice } = (payload ?? {}) as { choice: "cloud" | "local" | "merge" };
    const state = ctx.getState();
    const data = state.conflictData;
    if (!data) return;
    ctx.setState((draft) => {
      if (choice === "cloud") {
        draft.settings = { ...draft.settings, ...(data.cloudSettings ?? {}) };
        draft.chats = data.cloudChats;
      } else if (choice === "merge") {
        const cloudIds = new Set(data.cloudChats.map((c) => c.id));
        const uniqueLocal = data.localChats.filter((c) => !cloudIds.has(c.id));
        draft.chats = [...data.cloudChats, ...uniqueLocal].sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        // local — keep draft.chats
      }
      draft.activeChatId = draft.chats[0]?.id ?? draft.activeChatId;
      draft.cloudStatus = "ready";
      draft.cloudMessage = "Конфликт решён";
      draft.conflictData = null;
      draft.lastSyncTime = Date.now();
    });
  },
  "cloud/save": async (payload, ctx) => {
    const { userId, email } = (payload ?? {}) as { userId?: string; email?: string | null };
    const state = ctx.getState();
    if (!userId) return;
    ctx.setState((draft) => { draft.cloudStatus = "syncing"; draft.cloudMessage = "Сохраняю..."; });
    try {
      const result = await saveCloudWorkspace({ userId, email: email ?? null, settings: state.settings, chats: state.chats });
      ctx.setState((draft) => { draft.cloudStatus = "ready"; draft.cloudMessage = result.message; draft.lastSyncTime = Date.now(); });
    } catch (e) {
      ctx.setState((draft) => { draft.cloudStatus = "error"; draft.cloudMessage = e instanceof Error ? e.message : "Ошибка сохранения"; });
    }
  },
};
