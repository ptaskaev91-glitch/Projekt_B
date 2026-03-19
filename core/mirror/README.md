# Core Mirror Layer (Phase 5 / Step 55)

`core/mirror` prepares a backend-facing representation of Core behavior
without introducing endpoints or transport assumptions.

## Purpose

- keep backend shape aligned with frontend Core concepts
- mirror intent/decision flow as structured records
- prepare persistence and backend mirror work for next phases

## Scope

- type-safe mirror contracts (`MirrorRecord`, `MirrorBatch`)
- projection from `dispatch` structured logs into mirror records
- trace-based grouping for persistence pipelines

## Out of scope

- HTTP endpoints
- queue/broker integration
- DB writes
- infra/runtime transport code

## Current API

- `projectDispatchEntryToMirror(entry)`
- `projectDispatchLogEntries(entries)`
- `projectCurrentDispatchLogToMirror()`
- `groupMirrorRecordsByTrace(records)`

## Relation to Core

- source of truth: `core/actions/dispatch.ts` structured logs
- mirror keeps `traceId`, `actionId`, `actionType` correlation
- handler events become backend-ready mirror records
