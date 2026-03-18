import type { HandlerMap } from "../../../core/handlers/types";
import { modelsActionTypes, type ModelsSelectPayload } from "../actions";

export const modelsHandlers: HandlerMap = {
  [modelsActionTypes.select]: (payload, ctx) => {
    const { chatId, model } = (payload ?? {}) as ModelsSelectPayload;
    if (!chatId || !model) return;
    ctx.setState((draft) => {
      draft.chats = draft.chats.map((c) =>
        c.id === chatId ? { ...c, model, updatedAt: Date.now() } : c
      );
    });
  },
};
