# Market Dashboard

React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui (copy-in components) + TanStack Query, served by Nginx.

## Dev
    npm install
    npm run dev          # http://localhost:5173, proxies /api and /health to http://localhost:7013
    VITE_API_PROXY=http://localhost:9000 npm run dev   # different API port
    npm test

## Docker
    docker compose up --build        # http://localhost:8080
    API_UPSTREAM=http://market-data-api:8080 docker compose up --build   # API in the same network

Tests run during `docker build`; a failing test fails the image build.

## Architecture
- **Same-origin API access.** The frontend calls relative URLs (`/api/...`). Vite (dev) and Nginx (prod) proxy them to the Market Data API, so there is no CORS and the API address is configured only by `API_UPSTREAM`.
- **Independent cards.** Each card fetches its own data with TanStack Query (cache, polling, retry); one failing provider never breaks the page.
- **Thin API layer.** `src/lib/api.ts` is the only file that knows endpoints and response types.
- **All world currencies** in the FX card (`src/lib/currencies.ts`); pairs the data provider cannot quote show a friendly message.
- **Stocks & ETFs** share one card (same API payload); **bonds** are driven by a catalog (`src/lib/bonds.ts`) of markets and maturities, so adding one is a data change.
- **Plain SVG chart** for the Euribor curve (four points do not justify a chart library).

## CI/CD (`.github/workflows/ci-cd.yml`)
1. `test`: typecheck, unit tests, build.
2. `docker`: build the image, **smoke test the running container** (`smoke/smoke-test.sh` against `smoke/mock-api.mjs`), then publish to GHCR (`main` only).

Both checks are required by branch protection on `main`. Run the smoke test locally:

    docker build -t market-data-web:smoke .
    ./smoke/smoke-test.sh market-data-web:smoke
