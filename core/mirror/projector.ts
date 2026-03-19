import { getDispatchLog } from "../actions/dispatch";
import type { DispatchLogEntry } from "../actions/dispatch";
import type {
  MirrorBatch,
  MirrorDispatchProjection,
  MirrorHandlerRecord,
  MirrorLifecycleName,
  MirrorLifecycleRecord,
  MirrorRecord,
} from "./types";

function normalizeHandlerEvent(entry: DispatchLogEntry): MirrorHandlerRecord {
  const rawDetails = entry.details ?? {};
  const maybeEvent = rawDetails.event;
  const event = typeof maybeEvent === "string" ? maybeEvent : entry.event;
  const { event: _ignored, ...rest } = rawDetails;
  return {
    kind: "handler",
    version: "v1",
    traceId: entry.traceId,
    actionId: entry.actionId,
    actionType: entry.actionType,
    ts: entry.ts,
    level: entry.level,
    event,
    details: Object.keys(rest).length > 0 ? rest : undefined,
  };
}

function normalizeLifecycle(entry: DispatchLogEntry): MirrorLifecycleRecord {
  let lifecycle: MirrorLifecycleName = "started";
  if (entry.event === "action.missing_handler") lifecycle = "missing_handler";
  if (entry.event === "action.end") {
    lifecycle = entry.error ? "failed" : "finished";
  }

  return {
    kind: "lifecycle",
    version: "v1",
    traceId: entry.traceId,
    actionId: entry.actionId,
    actionType: entry.actionType,
    ts: entry.ts,
    lifecycle,
    level: entry.level,
    durationMs: entry.durationMs,
    payload: entry.payload,
    error: entry.error,
  };
}

export function projectDispatchEntryToMirror(entry: DispatchLogEntry): MirrorRecord {
  if (entry.event === "handler.event") {
    return normalizeHandlerEvent(entry);
  }
  return normalizeLifecycle(entry);
}

export function projectDispatchLogEntries(entries: DispatchLogEntry[]): MirrorDispatchProjection[] {
  return entries.map((entry) => ({
    entry,
    record: projectDispatchEntryToMirror(entry),
  }));
}

export function projectCurrentDispatchLogToMirror(): MirrorBatch {
  const entries = getDispatchLog();
  const records = entries.map(projectDispatchEntryToMirror);
  return {
    version: "v1",
    createdAt: Date.now(),
    records,
  };
}

export function groupMirrorRecordsByTrace(records: MirrorRecord[]) {
  const grouped = new Map<string, MirrorRecord[]>();
  for (const record of records) {
    const list = grouped.get(record.traceId);
    if (list) {
      list.push(record);
      continue;
    }
    grouped.set(record.traceId, [record]);
  }
  return grouped;
}
