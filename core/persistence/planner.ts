import type { DispatchLogEntry } from "../actions/dispatch";
import {
  groupMirrorRecordsByTrace,
  projectCurrentDispatchLogToMirror,
  projectDispatchLogEntries,
} from "../mirror";
import type { MirrorBatch, MirrorLifecycleRecord, MirrorRecord } from "../mirror";
import type {
  PersistedEvent,
  PersistedTrace,
  PersistedTraceStatus,
  PersistenceCheckpoint,
  PersistencePlan,
} from "./types";

function toTraceStatus(record: MirrorLifecycleRecord | undefined): PersistedTraceStatus {
  if (!record) return "running";
  if (record.lifecycle === "finished") return "ok";
  if (record.lifecycle === "failed") return "error";
  if (record.lifecycle === "missing_handler") return "missing_handler";
  return "running";
}

function toEventName(record: MirrorRecord): string {
  if (record.kind === "handler") return record.event;
  return `lifecycle/${record.lifecycle}`;
}

function toPersistedEvent(record: MirrorRecord, sequence: number): PersistedEvent {
  const base: PersistedEvent = {
    version: "v1",
    eventId: `${record.traceId}:${record.actionId}:${record.ts}:${record.kind}:${sequence}`,
    traceId: record.traceId,
    actionId: record.actionId,
    actionType: record.actionType,
    ts: record.ts,
    level: record.level,
    kind: record.kind,
    name: toEventName(record),
  };

  if (record.kind === "handler") {
    if (record.details) {
      base.details = record.details;
    }
    return base;
  }

  if (record.payload !== undefined) {
    base.payload = record.payload;
  }
  if (record.durationMs !== undefined) {
    base.durationMs = record.durationMs;
  }
  if (record.error) {
    base.error = record.error;
  }
  return base;
}

function sortByTs(records: MirrorRecord[]) {
  return [...records].sort((a, b) => {
    if (a.ts === b.ts) {
      return a.actionId.localeCompare(b.actionId);
    }
    return a.ts - b.ts;
  });
}

function extractTraceSummary(records: MirrorRecord[]): PersistedTrace {
  const sorted = sortByTs(records);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const lifecycleRecords = sorted.filter(
    (record): record is MirrorLifecycleRecord => record.kind === "lifecycle",
  );
  const started = lifecycleRecords.find((record) => record.lifecycle === "started");
  const terminal = [...lifecycleRecords].reverse().find((record) =>
    record.lifecycle === "finished"
    || record.lifecycle === "failed"
    || record.lifecycle === "missing_handler"
  );

  const status = toTraceStatus(terminal);
  const startedAt = started?.ts ?? first.ts;
  const endedAt = terminal?.ts;
  const durationMs = terminal?.durationMs ?? (endedAt ? endedAt - startedAt : undefined);

  return {
    version: "v1",
    traceId: first.traceId,
    actionId: first.actionId,
    actionType: first.actionType,
    status,
    startedAt,
    endedAt,
    durationMs,
    error: terminal?.error,
    recordCount: sorted.length,
    updatedAt: last.ts,
  };
}

function createCheckpoint(
  batch: MirrorBatch,
  records: MirrorRecord[],
  tracesInBatch: number,
  previous: PersistenceCheckpoint | null,
): PersistenceCheckpoint {
  const cursorTs = records.length > 0
    ? records[records.length - 1].ts
    : (previous?.cursorTs ?? batch.createdAt);

  return {
    version: "v1",
    cursorTs,
    lastBatchCreatedAt: batch.createdAt,
    batchRecords: records.length,
    batchTraces: tracesInBatch,
    totalRecords: (previous?.totalRecords ?? 0) + records.length,
    totalTraces: (previous?.totalTraces ?? 0) + tracesInBatch,
    updatedAt: Date.now(),
  };
}

export function buildPersistencePlanFromMirrorBatch(
  batch: MirrorBatch,
  previousCheckpoint: PersistenceCheckpoint | null = null,
): PersistencePlan {
  const records = sortByTs(batch.records);
  const operations: PersistencePlan["operations"] = [];
  const grouped = groupMirrorRecordsByTrace(records);
  let sequence = 0;

  for (const traceRecords of grouped.values()) {
    operations.push({
      type: "trace/upsert",
      trace: extractTraceSummary(traceRecords),
    });

    const sortedTraceRecords = sortByTs(traceRecords);
    for (const record of sortedTraceRecords) {
      operations.push({
        type: "event/append",
        event: toPersistedEvent(record, sequence),
      });
      sequence += 1;
    }
  }

  operations.push({
    type: "checkpoint/save",
    checkpoint: createCheckpoint(batch, records, grouped.size, previousCheckpoint),
  });

  return {
    version: "v1",
    createdAt: Date.now(),
    sourceBatchCreatedAt: batch.createdAt,
    sourceRecordCount: records.length,
    operations,
  };
}

export function buildPersistencePlanFromDispatchEntries(
  entries: DispatchLogEntry[],
  previousCheckpoint: PersistenceCheckpoint | null = null,
): PersistencePlan {
  const records = projectDispatchLogEntries(entries).map((projection) => projection.record);
  const batch: MirrorBatch = {
    version: "v1",
    createdAt: Date.now(),
    records,
  };
  return buildPersistencePlanFromMirrorBatch(batch, previousCheckpoint);
}

export function buildPersistencePlanFromCurrentDispatchLog(
  previousCheckpoint: PersistenceCheckpoint | null = null,
): PersistencePlan {
  const batch = projectCurrentDispatchLogToMirror();
  return buildPersistencePlanFromMirrorBatch(batch, previousCheckpoint);
}

