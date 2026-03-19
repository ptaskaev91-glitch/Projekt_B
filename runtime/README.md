# Runtime Layer (Phase 5)

`runtime/` owns how the product is built, deployed, and delivered.

## Runtime scope

- Docker build and container serving
- Nginx/static delivery config
- deploy scripts for server rollout
- environment injection for build/deploy
- CI/CD and hosting-facing instructions
- preview/production delivery paths

## Runtime does not own

- business logic
- action handlers
- selectors and domain state
- UI composition
- module behavior
- feature semantics

## Product layers

Product behavior lives in:

- `src/` for UI orchestration and adapters
- `core/` for intents, handlers, and state decisions
- `modules/` for isolated product features

## Boundary contract

1. `runtime/` never imports from `src/`, `core/`, or `modules/`
2. product code never imports from `runtime/*`
3. runtime injects env values; product interprets them
4. changing host platform must not change product behavior

## Current runtime assets

- `runtime/Dockerfile`
- `runtime/nginx.conf`
- `runtime/deploy.sh`
- `runtime/.env.production.example`

## Current delivery paths

- Vercel preview: fast external review/shareable links
- Docker/TimeWeb: persistent server deployment path

## Related ADR

- `adr/001-architecture-guardrails.md`
- `adr/002-runtime-vs-product-boundary.md`
