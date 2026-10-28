// Minimal fake of the Market Data API used by the smoke test.
// It answers a handful of endpoints with fixed payloads so the test never depends on
// external providers (Yahoo, ECB...) that could be down and block every pull request.
// Usage: node smoke/mock-api.mjs [port]
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 9999);

const meta = (source) => ({ source, asOf: "2026-10-27" });
const routes = {
  "/health": { type: "text/plain", body: "Healthy" },
  "/api/fx/EUR/USD": { body: { base: "EUR", quote: "USD", rate: 1.1188, date: "2026-10-26", source: "Frankfurter" } },
  "/api/euribor/3M": { body: { data: { tenor: "3M", rate: 2.6350455, unit: "Percent per annum", frequency: "Monthly average" }, metadata: meta("ECB") } },
  "/api/stocks/AAPL": { body: { data: { symbol: "AAPL", name: "Apple Inc.", price: 343.045, currency: "USD", changePercent: 1.04, volume: 3600565 }, metadata: meta("Yahoo") } },
  "/api/commodities/GOLD": { body: { data: { symbol: "GOLD", name: "Gold futures", price: 4039.8, currency: "USD", unit: "USD per troy ounce" }, metadata: meta("Yahoo") } },
};

createServer((req, res) => {
  const route = routes[req.url ?? ""];
  if (!route) {
    // Unknown paths return 404 so the test can verify that Nginx forwards error statuses untouched.
    res.writeHead(404, { "content-type": "text/plain" }).end("Not Found");
    return;
  }
  const type = route.type ?? "application/json";
  res.writeHead(200, { "content-type": type }).end(typeof route.body === "string" ? route.body : JSON.stringify(route.body));
}).listen(port, () => console.log(`mock API listening on :${port}`));
