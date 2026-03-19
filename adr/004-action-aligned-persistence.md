# ADR 004 — Action-Aligned Persistence Design

## Status
Accepted

## Context

Phase 5 step 56 requires persistence design that follows Core behavior
instead of endpoint/storage-first modeling.

By this point:

- action flow is explicit in `dispatch` (`actionId`, `traceId`)
- `core/mirror` projects dispatch events into backend-ready records
- runtime and product boundaries are fixed by ADR 002

We need a persistence contract that can be implemented with any storage
adapter while preserving intent semantics.

## Decision

Introduce `core/persistence` as a storage-agnostic planning layer.

`core/persistence` defines:

- persisted trace model (`PersistedTrace`)
- persisted event model (`PersistedEvent`)
- checkpoint model for incremental sync (`PersistenceCheckpoint`)
- deterministic operation plan (`PersistencePlan` with `trace/upsert`,
  `event/append`, `checkpoint/save`)
- in-memory journal implementation for replay/debug (`createPersistenceJournal`)

Planner entry points:

- mirror batch -> persistence plan
- dispatch entries -> persistence plan
- current dispatch log -> persistence plan

## Boundary

`core/persistence`:

- depends on `core/mirror` and dispatch contracts
- does not depend on DB clients, HTTP endpoints, or runtime scripts
- defines *what to persist*, not *where/how to persist*

## Consequences

Positive:

- persistence is aligned with action vocabulary and trace correlation
- future DB/queue adapters can stay thin (apply operation plan only)
- replay/debug workflows become deterministic

Tradeoffs:

- additional schema versioning responsibility for persistence contracts
- adapter layer still needed in future steps for real storage writes

## Implementation notes

- contracts: `core/persistence/types.ts`
- planner: `core/persistence/planner.ts`
- in-memory journal: `core/persistence/journal.ts`
- public API: `core/persistence/index.ts`
- scope docs: `core/persistence/README.md`

