import type { AppState } from "../state";

export type HandlerLogLevel = "debug" | "info" | "warn" | "error";

export type HandlerContext = {
  setState: (producer: (draft: AppState) => void) => void;
  getState: () => AppState;
  traceId: string;
  actionType: string;
  log: (
    event: string,
    details?: Record<string, unknown>,
    level?: HandlerLogLevel,
  ) => void;
};

export type HandlerMap = {
  [type: string]: (payload: unknown, ctx: HandlerContext) => unknown;
};
