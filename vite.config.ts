import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

// In dev, proxy API calls to the Market Data API. The browser then only talks to Vite (same origin),
// which mirrors what Nginx does in production and avoids CORS. Override the target with VITE_API_PROXY.
const API = process.env.VITE_API_PROXY ?? "http://localhost:7013";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: { port: 5173, proxy: { "/api": API, "/health": API } },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/test/setup.ts", css: false },
});
