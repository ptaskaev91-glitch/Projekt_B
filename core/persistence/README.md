# Core Persistence Layer (Phase 5 / Step 56)

`core/persistence` defines how Core behavior is persisted without binding to
any specific database or transport.

## Purpose

- keep persistence shape aligned with `actionId` / `traceId` flow
- persist mirror records as explicit operations (`trace/upsert`, `event/append`)
- maintain a checkpoint cursor for incremental persistence pipelines

## Scope

- persistence contracts (`PersistedTrace`, `PersistedEvent`, `PersistencePlan`)
- planner: mirror/dispatch logs -> persistence operations
- in-memory journal for local replay/debug and contract checks

## Out of scope

- SQL schema or ORM mapping
- network endpoints, queues, workers
- runtime deployment details

## Current API

- `buildPersistencePlanFromMirrorBatch(batch, previousCheckpoint?)`
- `buildPersistencePlanFromDispatchEntries(entries, previousCheckpoint?)`
- `buildPersistencePlanFromCurrentDispatchLog(previousCheckpoint?)`
- `createPersistenceJournal(options?, initial?)`

## Alignment with Core

- source semantics remain intent-driven (`dispatch` -> mirror -> persistence)
- persistence units preserve `traceId`, `actionId`, `actionType`
- planner emits deterministic operations, so storage adapters can stay thin

