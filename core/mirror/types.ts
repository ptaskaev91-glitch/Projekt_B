import type { DispatchLogEntry, DispatchLogLevel } from "../actions/dispatch";

export type MirrorVersion = "v1";

export type MirrorLifecycleName = "started" | "finished" | "failed" | "missing_handler";

export type MirrorLifecycleRecord = {
  kind: "lifecycle";
  version: MirrorVersion;
  traceId: string;
  actionId: string;
  actionType: string;
  ts: number;
  lifecycle: MirrorLifecycleName;
  level: DispatchLogLevel;
  durationMs?: number;
  payload?: unknown;
  error?: string;
};

export type MirrorHandlerRecord = {
  kind: "handler";
  version: MirrorVersion;
  traceId: string;
  actionId: string;
  actionType: string;
  ts: number;
  level: DispatchLogLevel;
  event: string;
  details?: Record<string, unknown>;
};

export type MirrorRecord = MirrorLifecycleRecord | MirrorHandlerRecord;

export type MirrorBatch = {
  version: MirrorVersion;
  createdAt: number;
  records: MirrorRecord[];
};

export type MirrorDispatchProjection = {
  entry: DispatchLogEntry;
  record: MirrorRecord;
};
