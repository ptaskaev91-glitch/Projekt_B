import type { DispatchLogLevel } from "../actions/dispatch";
import type { MirrorRecord } from "../mirror";

export type PersistenceVersion = "v1";

export type PersistedTraceStatus = "running" | "ok" | "error" | "missing_handler";

export type PersistedTrace = {
  version: PersistenceVersion;
  traceId: string;
  actionId: string;
  actionType: string;
  status: PersistedTraceStatus;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  error?: string;
  recordCount: number;
  updatedAt: number;
};

export type PersistedEvent = {
  version: PersistenceVersion;
  eventId: string;
  traceId: string;
  actionId: string;
  actionType: string;
  ts: number;
  level: DispatchLogLevel;
  kind: MirrorRecord["kind"];
  name: string;
  details?: Record<string, unknown>;
  payload?: unknown;
  durationMs?: number;
  error?: string;
};

export type PersistenceCheckpoint = {
  version: PersistenceVersion;
  cursorTs: number;
  lastBatchCreatedAt: number;
  batchRecords: number;
  batchTraces: number;
  totalRecords: number;
  totalTraces: number;
  updatedAt: number;
};

export type PersistenceOperation =
  | { type: "trace/upsert"; trace: PersistedTrace }
  | { type: "event/append"; event: PersistedEvent }
  | { type: "checkpoint/save"; checkpoint: PersistenceCheckpoint };

export type PersistencePlan = {
  version: PersistenceVersion;
  createdAt: number;
  sourceBatchCreatedAt: number;
  sourceRecordCount: number;
  operations: PersistenceOperation[];
};

export type PersistenceJournalSnapshot = {
  traces: PersistedTrace[];
  events: PersistedEvent[];
  checkpoint: PersistenceCheckpoint | null;
};

