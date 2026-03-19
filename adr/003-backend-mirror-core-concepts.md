# ADR 003 — Backend Mirror of Core Concepts (No Endpoints)

## Status
Accepted

## Context

Phase 5 step 55 requires backend preparation without endpoint-first design.
We already have:

- intent-based action flow in Core
- structured `dispatch` logs with trace correlation
- runtime/product boundary fixed by ADR 002

We need a backend-ready shape that mirrors Core semantics while staying
transport-agnostic.

## Decision

Introduce `core/mirror` as a contract and projection layer.

`core/mirror` converts Core dispatch events into backend-ready mirror records:

- lifecycle records (`started`, `finished`, `failed`, `missing_handler`)
- handler/domain event records
- grouped trace projections for future persistence pipelines

No endpoints, queues, or DB writes are introduced at this stage.

## Boundary

`core/mirror`:

- depends on Core structured logs
- does not depend on runtime deployment
- does not define transport/API contracts
- does not write to storage

## Consequences

Positive:

- backend mirror design is aligned with Core behavior, not endpoint shape
- easier future persistence design in step 56
- clean path to mirror replay/debug workflows

Tradeoffs:

- one more abstraction layer to maintain
- schema versioning discipline is now required (`MirrorVersion`)

## Implementation notes

- mirror contracts: `core/mirror/types.ts`
- dispatch -> mirror projection: `core/mirror/projector.ts`
- mirror API exports: `core/mirror/index.ts`
- mirror scope docs: `core/mirror/README.md`
