# Map-K Vercel mirror

Deployment-only repository for `projektb.vercel.app`.

The Vercel function proxies the published Map-K build from GitHub Pages while keeping the Vercel address in the browser. Until the Pages build is available, document requests safely fall back to the last working deployment of the previous application. The private Map-K source code and its secrets are not copied into this public repository.

## Canonical deployment flow

This repository is the deployment source of truth for the Vercel project `projekt_b`.

- `main` is the production branch. A push/merge to `main` must create the Production deployment through Vercel Git Integration.
- Feature branches and pull requests are used for Preview deployments and validation before merge.
- Routine deployments must not use manual `vercel --prod`, ad-hoc API deploys, or experimental OIDC/Connect flows.
- Vercel OIDC is only relevant for runtime service-to-service authentication; it is not the deployment authentication mechanism.
- Production configuration lives in version control (`vercel.json`, `package.json`, `api/proxy.js`). Secrets, if introduced later, belong only in Vercel Environment Variables and must never be committed.
- Rollback should use a previously known-good Vercel deployment; normal forward changes should return to the Git flow above.

## Current architecture

1. GitHub repository `Projekt_B` contains the small deployment shell.
2. Vercel builds it with Vite (`npm run build`) and serves the serverless route `/api/proxy`.
3. `vercel.json` routes incoming paths to `/api/proxy`.
4. The proxy serves the published Map-K build from GitHub Pages and uses the existing fallback deployment only if the upstream document is unavailable.

The intended operating rule is simple: **change code in GitHub, validate Preview, merge to `main`, let Vercel deploy Production automatically.**
