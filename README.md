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
