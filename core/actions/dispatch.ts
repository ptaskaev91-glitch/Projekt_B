export type Action<T = unknown> = {
  type: string;
  payload?: T;
  meta?: Record<string, unknown>;
};

export type ActionHandlers = Record<string, (payload: unknown) => unknown>;

export type ActionLogItem = {
  type: string;
  payload?: unknown;
  tsStart: number;
  tsEnd?: number;
  status: "pending" | "ok" | "error";
  error?: string;
};
export const actionLog: ActionLogItem[] = [];

export async function dispatch(action: Action, handlers: ActionHandlers) {
  const logItem: ActionLogItem = {
    type: action.type,
    payload: action.payload,
    tsStart: Date.now(),
    status: "pending",
  };
  actionLog.push(logItem);
  console.info("[dispatch]", action.type, action.payload ?? null);
  const handler = handlers[action.type];
  if (!handler) {
    console.warn("[dispatch] no handler for", action.type);
    logItem.status = "error";
    logItem.tsEnd = Date.now();
    logItem.error = "no handler";
    return;
  }
  try {
    const result = await Promise.resolve(handler(action.payload));
    logItem.status = "ok";
    logItem.tsEnd = Date.now();
    return result;
  } catch (err) {
    logItem.status = "error";
    logItem.tsEnd = Date.now();
    logItem.error = err instanceof Error ? err.message : String(err);
    throw err;
  }
}
