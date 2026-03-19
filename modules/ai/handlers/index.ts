import { buildPromptWithContext, uid, wait } from "../../../src/types";
import { createTextJobViaProxy, getTextJobStatusViaProxy } from "../../../src/lib";
import type { HandlerMap } from "../../../core/handlers/types";
import { aiActionTypes, type AiSendMessagePayload } from "../actions";

export const aiHandlers: HandlerMap = {
  [aiActionTypes.sendMessage]: async (payload, ctx) => {
    const { userText, chatId, effectiveModelName } = (payload ?? {}) as AiSendMessagePayload;
    if (!userText || !chatId) {
      ctx.log(
        "chat.send.invalid_payload",
        { hasUserText: Boolean(userText), hasChatId: Boolean(chatId) },
        "warn",
      );
      return;
    }

    const state = ctx.getState();
    const chat = state.chats.find((item) => item.id === chatId);
    if (!chat) {
      ctx.log("chat.send.chat_not_found", { chatId }, "warn");
      return;
    }

    ctx.setState((draft) => {
      const userMsg = {
        id: uid(),
        role: "user" as const,
        content: userText,
        createdAt: Date.now(),
        status: "done" as const,
      };
      const assistantMsg = {
        id: uid(),
        role: "assistant" as const,
        content: "Генерирую...",
        createdAt: Date.now(),
        status: "loading" as const,
      };
      draft.chats = draft.chats.map((item) =>
        item.id === chatId
          ? {
              ...item,
              title: item.messages.length === 0 ? userText.slice(0, 42) : item.title,
              updatedAt: Date.now(),
              messages: [...item.messages, userMsg, assistantMsg],
            }
          : item,
      );
    });

    try {
      const { settings } = ctx.getState();
      const preset = settings.presets.find((item) => item.id === settings.activePresetId) ?? settings.presets[0];
      const { prompt } = buildPromptWithContext(
        chat,
        userText,
        settings.systemPrompt,
        settings.maxContextTokens,
      );
      const modelToUse = effectiveModelName || chat.model || "aphrodite";
      ctx.log("chat.send.job_create", { chatId, model: modelToUse }, "info");

      const create = await createTextJobViaProxy(
        {
          prompt,
          models: [modelToUse],
          params: {
            max_length: preset?.maxLength ?? 400,
            temperature: preset?.temperature ?? 0.8,
            top_p: preset?.topP ?? 0.9,
            top_k: preset?.topK ?? 50,
            rep_pen: preset?.repetitionPenalty ?? 1.05,
          },
        },
        { apiKey: settings.apiKey, clientAgent: settings.clientAgent },
      );

      if (!create?.id) {
        throw new Error("Не получен id задачи.");
      }
      ctx.log("chat.send.job_created", { chatId, jobId: create.id }, "debug");

      for (let attempt = 0; attempt < 90; attempt += 1) {
        const status = await getTextJobStatusViaProxy(create.id, {
          apiKey: settings.apiKey,
          clientAgent: settings.clientAgent,
        });
        ctx.setState((draft) => {
          draft.chats = draft.chats.map((item) =>
            item.id === chatId
              ? {
                  ...item,
                  updatedAt: Date.now(),
                  messages: item.messages.map((message) =>
                    message.id === item.messages[item.messages.length - 1].id
                      ? { ...message, queuePosition: status.queue_position, waitTime: status.wait_time }
                      : message,
                  ),
                }
              : item,
          );
        });

        if (status.done && Array.isArray(status.generations) && status.generations[0]) {
          const generation = status.generations[0];
          ctx.log("chat.send.job_done", { chatId, worker: generation.worker_name ?? null }, "info");
          ctx.setState((draft) => {
            draft.chats = draft.chats.map((item) =>
              item.id === chatId
                ? {
                    ...item,
                    updatedAt: Date.now(),
                    messages: item.messages.map((message, index) =>
                      index === item.messages.length - 1
                        ? {
                            ...message,
                            status: "done",
                            content: generation.text,
                            workerName: generation.worker_name,
                          }
                        : message,
                    ),
                  }
                : item,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка";
      ctx.log("chat.send.error", { chatId, message }, "error");
      ctx.setState((draft) => {
        draft.chats = draft.chats.map((item) =>
          item.id === chatId
            ? {
                ...item,
                updatedAt: Date.now(),
                messages: item.messages.map((entry, index) =>
                  index === item.messages.length - 1
                    ? { ...entry, status: "error" as const, content: message }
                    : entry,
                ),
              }
            : item,
        );
        draft.validationErrors = [...draft.validationErrors, message];
      });
    }
  },
};

