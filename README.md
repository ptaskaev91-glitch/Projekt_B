# Map-K Vercel mirror

Deployment-only shell for the Vercel project `projekt_b` / `projektb.vercel.app`.

This repository has one current responsibility: proxy the published Map-K build from GitHub Pages while preserving the Vercel address in the browser. It must not be used as a server recovery/control plane or as the live source repository for unrelated applications.

## Canonical deployment flow

- Map-K product source and data live outside this repository.
- `Projekt_B/main` contains only the small Vercel deployment shell.
- Vercel builds with Vite and routes requests to `/api/proxy`.
- `/api/proxy` fetches the canonical GitHub Pages build from `ptaskaev91-glitch.github.io/Map-K/`.
- If the server-side proxy cannot fetch a document, the browser fallback redirects to the same canonical GitHub Pages location. There is no fallback to the historical AI application.
- Normal production changes go through Git and Vercel Git Integration. Rollback should use a known-good Vercel deployment or the preserved Git history.

## Scope boundary

The historical AI Horde application that once occupied this repository remains preserved in Git history, including commit `d0ce83385a31bc5540631bb48e471f6654f5ad7d`, but it is no longer a responsibility of this deployment shell.

Legacy bootstrap, Moscow recovery, Brain recovery and Vercel diagnostic endpoints have been retired from the active Map-K shell after their replacement paths were verified. The pre-split state is preserved on branch `archive/pre-split-2026-09-02`.
