# Market Dashboard

A responsive market dashboard built with React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui-style local components and TanStack Query. Nginx serves the production build and reverse-proxies API requests to the Market Data API.

## Features

- Euribor curve, FX rates, stocks/ETFs, government bond yields, crypto assets/quotes and commodity futures.
- Independent data cards: each card owns its TanStack Query request, cache, polling and error state, so one upstream failure does not blank the dashboard.
- API availability badge polls `/health` every 15 seconds; the refresh button invalidates active queries.
- Typed API client and response contracts are centralized in `src/lib/api.ts` and `src/lib/types.ts`.
- Currency and bond-market/maturity choices are data catalogs in `src/lib/currencies.ts` and `src/lib/bonds.ts`.

## Development

Requires **Node.js 22 or later** and npm. The project has been verified locally with **Node.js 26.13.0** and **npm 11.20.0**. The installed **React and React DOM versions are 19.3.1**, confirmed with `npm list react`. The Docker build and GitHub Actions workflow currently use Node.js 22, so local development and CI do not yet use identical Node.js major versions.

> **Framework note:** this repository is a React 19 + TypeScript + Vite application. Angular CLI is not used by this project. Having Angular CLI 22.2.5 installed globally (`ng --version`) does not make this application an Angular application; there is no `angular.json` or Angular build configuration in this repository.

Python 3.13.14 is available in the local development environment but is not required by this frontend's build, test or runtime workflows.

```bash
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` and `/health` to `http://localhost:7013` by default. To use another API address:

```bash
VITE_API_PROXY=http://localhost:9000 npm run dev
```

Available scripts:

| Command | Purpose |
|---|---|
| `npm run typecheck` | TypeScript type check without emitting files |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Type-check and create the production Vite build |
| `npm run preview` | Preview the production build locally |

## Architecture and API routing

- **Same-origin requests:** the browser calls relative paths (`/api/...` and `/health`). Vite proxies them during development; Nginx proxies them in the container. The browser therefore does not need a configured API host or CORS access.
- **API client:** `src/lib/api.ts` contains the endpoint URLs, JSON parsing and `ApiError` handling. Response types are in `src/lib/types.ts`.
- **Server state:** TanStack Query handles caching, polling, retries and independent loading/error states. React local state is reserved for UI input.
- **Components:** `src/components/` contains the market cards and small shared UI primitives. The Euribor chart is plain SVG rather than a charting dependency.
- **Bond catalog:** `src/lib/bonds.ts` describes US Treasury and ECB euro-area AAA curve maturities. These are yield curves, not individual bond prices.
- **Currency catalog:** `src/lib/currencies.ts` supplies the FX currency selector.

## Docker

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). The Nginx container serves the static build and forwards API traffic to `API_UPSTREAM`. The Compose default points to the API published on the Docker host at port 7013. If both services share a Docker network, set the upstream to the API service name:

```bash
API_UPSTREAM=http://market-data-api:8080 docker compose up --build
```

The Dockerfile uses Node 22 to install dependencies, run tests and build the app; the runtime image contains Nginx and static assets only. The Nginx template substitutes `API_UPSTREAM` at container startup, forwards `/api/` and `/health`, caches fingerprinted `/assets/` files as immutable and falls back to `index.html` for client-side routes.

### Container smoke test

The smoke test verifies the actual production image rather than only mocked component requests. It starts `smoke/mock-api.mjs`, runs the container against that fake API, then checks the index page, SPA fallback, health/API proxying, upstream error propagation and immutable asset caching.

```bash
docker build -t market-data-web:smoke .
./smoke/smoke-test.sh market-data-web:smoke
```

## CI/CD

The workflow is `.github/workflows/ci-cd.yml`. It runs on pull requests targeting `main`, pushes to `main` and manual dispatch.

1. **test:** checks out the repository, installs Node 22 with npm cache, runs `npm ci`, TypeScript type checking, Vitest and the production build. The generated `dist` directory is uploaded as a short-lived artifact.
2. **docker:** waits for `test`, builds the real image locally, then runs the container smoke test against the mock API.
3. **Publish:** only non-PR runs log in to GHCR and push the image. Pull requests validate the Docker image but do not publish it.
4. **deploy:** runs only after the Docker job, only on pushes to `main`, and only when `AZURE_DEPLOY_ENABLED=true`. Azure authentication uses GitHub OIDC; the job needs `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` secrets and `AZURE_RESOURCE_GROUP`, `AZURE_CONTAINER_APP_NAME` variables.

The workflow uses least-privilege permissions: package write access is scoped to the Docker job, and OIDC token access is scoped to deployment. The repository's main-branch protection is intended to require the `test` and `docker` checks before merging.

## Azure deployment

The target is Azure Container Apps Consumption in Spain Central, with scale-to-zero. The API repository contains the Bicep infrastructure and deployment guide: [market-data-api/infra](https://github.com/gclopes1978/market-data-api/tree/feature/azure-container-apps-zero-cost/infra).

Keep `AZURE_DEPLOY_ENABLED` unset or false until the Azure resources, GHCR package visibility, OIDC trust and GitHub Actions configuration are ready. The zero-cost target depends on total subscription consumption staying within the applicable free grants.
