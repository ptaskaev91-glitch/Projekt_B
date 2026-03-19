export type Action<T = unknown> = {
  type: string;
  payload?: T;
  meta?: Record<string, unknown>;
};

export type DispatchLogLevel = "debug" | "info" | "warn" | "error";
export type DispatchEventType =
  | "action.start"
  | "action.end"
  | "action.missing_handler"
  | "handler.event";

export type DispatchRuntimeContext = {
  actionId: string;
  traceId: string;
  log: (
    event: string,
    details?: Record<string, unknown>,
    level?: DispatchLogLevel,
  ) => void;
};

export type ActionHandlers = Record<
  string,
  (payload: unknown, runtime: DispatchRuntimeContext) => unknown
>;

export type ActionLogItem = {
  actionId: string;
  traceId: string;
  type: string;
  payload?: unknown;
  tsStart: number;
  tsEnd?: number;
  durationMs?: number;
  status: "pending" | "ok" | "error";
  error?: string;
};

export type DispatchLogEntry = {
  id: string;
  ts: number;
  level: DispatchLogLevel;
  event: DispatchEventType;
  actionId: string;
  traceId: string;
  actionType: string;
  payload?: unknown;
  durationMs?: number;
  details?: Record<string, unknown>;
  error?: string;
};

const MAX_LOG_ENTRIES = 500;

export const actionLog: ActionLogItem[] = [];
const dispatchLog: DispatchLogEntry[] = [];
const listeners = new Set<(entry: DispatchLogEntry) => void>();

let sequence = 0;

function nextId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

function pushDispatchLog(entry: Omit<DispatchLogEntry, "id">) {
  const next: DispatchLogEntry = {
    id: nextId("log"),
    ...entry,
  };
  dispatchLog.push(next);
  if (dispatchLog.length > MAX_LOG_ENTRIES) {
    dispatchLog.splice(0, dispatchLog.length - MAX_LOG_ENTRIES);
  }
  for (const listener of listeners) {
    listener(next);
  }
  return next;
}

export function getDispatchLog() {
  return [...dispatchLog];
}

export function clearDispatchLog() {
  dispatchLog.length = 0;
}

export function subscribeDispatchLog(listener: (entry: DispatchLogEntry) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function dispatch(action: Action, handlers: ActionHandlers) {
  const tsStart = Date.now();
  const actionId = nextId("action");
  const traceId = typeof action.meta?.traceId === "string"
    ? action.meta.traceId
    : actionId;

  const logItem: ActionLogItem = {
    actionId,
    traceId,
    type: action.type,
    payload: action.payload,
    tsStart,
    status: "pending",
  };
  actionLog.push(logItem);
  if (actionLog.length > MAX_LOG_ENTRIES) {
    actionLog.splice(0, actionLog.length - MAX_LOG_ENTRIES);
  }

  pushDispatchLog({
    ts: tsStart,
    level: "info",
    event: "action.start",
    actionId,
    traceId,
    actionType: action.type,
    payload: action.payload,
    details: {
      hasPayload: typeof action.payload !== "undefined",
      hasMeta: typeof action.meta !== "undefined",
    },
  });

  const runtime: DispatchRuntimeContext = {
    actionId,
    traceId,
    log: (event, details = {}, level = "info") => {
      pushDispatchLog({
        ts: Date.now(),
        level,
        event: "handler.event",
        actionId,
        traceId,
        actionType: action.type,
        details: {
          event,
          ...details,
        },
      });
    },
  };

  const handler = handlers[action.type];
  if (!handler) {
    const tsEnd = Date.now();
    const durationMs = tsEnd - tsStart;
    logItem.status = "error";
    logItem.tsEnd = tsEnd;
    logItem.durationMs = durationMs;
    logItem.error = "no handler";

    pushDispatchLog({
      ts: tsEnd,
      level: "warn",
      event: "action.missing_handler",
      actionId,
      traceId,
      actionType: action.type,
      durationMs,
      error: "no handler",
    });

    console.warn("[dispatch] no handler for", action.type);
    return;
  }

  try {
    const result = await Promise.resolve(handler(action.payload, runtime));
    const tsEnd = Date.now();
    const durationMs = tsEnd - tsStart;
    logItem.status = "ok";
    logItem.tsEnd = tsEnd;
    logItem.durationMs = durationMs;

    pushDispatchLog({
      ts: tsEnd,
      level: "info",
      event: "action.end",
      actionId,
      traceId,
      actionType: action.type,
      durationMs,
      details: {
        status: "ok",
      },
    });
    return result;
  } catch (err) {
    const tsEnd = Date.now();
    const durationMs = tsEnd - tsStart;
    const message = err instanceof Error ? err.message : String(err);
    logItem.status = "error";
    logItem.tsEnd = tsEnd;
    logItem.durationMs = durationMs;
    logItem.error = message;

    pushDispatchLog({
      ts: tsEnd,
      level: "error",
      event: "action.end",
      actionId,
      traceId,
      actionType: action.type,
      durationMs,
      error: message,
      details: {
        status: "error",
      },
    });
    throw err;
  }
}
