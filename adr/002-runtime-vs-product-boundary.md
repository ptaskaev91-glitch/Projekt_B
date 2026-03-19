# ADR 002 — Runtime vs Product Boundary

## Status
Accepted

## Context

Phase 5 moves the project from "single app" toward a small platform. By this point:

- `runtime/` exists and already owns deployment artifacts
- `core/`, `modules/`, `src/` own user-facing behavior
- online preview exists via Vercel
- Docker/TimeWeb path exists for persistent hosting

Without a clear boundary, infrastructure concerns will leak into product code,
and product logic will start depending on deployment-specific details.

## Decision

We split responsibility into two layers:

### Runtime owns

- build and deploy mechanics
- container/server config
- environment injection into the build/runtime
- CI/CD and hosting-specific setup
- public delivery of the built artifact
- operational docs for preview/production rollout

### Product owns

- user intents and action vocabulary
- domain state and selectors
- handlers, orchestration, and business rules
- modules and UI composition
- API usage semantics from the application's point of view
- feature behavior independent of the host platform

## Boundary rules

1. `runtime/` must not import from `src/`, `core/`, or `modules/`.
2. Product code must not depend on `runtime/*` paths or deployment scripts.
3. Environment variables may enter through runtime, but their application-level
   interpretation stays in product adapters such as `src/lib.ts`.
4. Hosting may change (Vercel, Docker, TimeWeb), but product behavior must stay
   unchanged.
5. Runtime can decide "how the app is delivered"; product decides "how the app
   behaves".

## Consequences

Positive:

- easier hosting swaps
- lower risk of infra-specific regressions in product code
- cleaner foundation for structured logging and debug tooling
- clearer ownership for future deployment and backend mirror work

Tradeoffs:

- some docs/config now exist in two places (`runtime` and product docs)
- env handling requires discipline: runtime injects, product interprets

## Implementation notes

- `runtime/README.md` documents runtime scope and forbidden dependencies
- `development.md` treats step 52 as complete after this ADR
- next steps build on this boundary: structured logging, debug timeline, backend mirror
