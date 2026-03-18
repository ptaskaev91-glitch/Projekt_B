import type { AppState } from "../state";

export type HandlerContext = {
  setState: (producer: (draft: AppState) => void) => void;
  getState: () => AppState;
};

export type HandlerMap = {
  [type: string]: (payload: unknown, ctx: HandlerContext) => unknown;
};
