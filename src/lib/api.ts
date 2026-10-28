import type { Bond, Commodity, Envelope, Euribor, FxRate, Stock } from "./types";

/** Error thrown when the API answers with a non-2xx status; keeps the HTTP status code. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Performs a GET request and throws an ApiError for any non-2xx response. */
async function request(path: string): Promise<Response> {
  const res = await fetch(path);
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`.trim());
  return res;
}

/** GET helper that parses the response body as JSON and types it as T. */
const getJson = async <T,>(path: string) => (await request(path)).json() as Promise<T>;

// Options offered by the UI: Euribor tenors, commodity symbols and FX currencies.
export const TENORS = ["1M", "3M", "6M", "12M"] as const;
export const COMMODITIES = ["GOLD", "SILVER", "WTI", "BRENT", "NATGAS"] as const;
export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY"] as const;

/** Typed client for the Market Data API: one method per endpoint. */
export const api = {
  // GET /health -> plain text ("Healthy").
  health: async () => (await request("/health")).text(),
  // GET /api/fx/{base}/{quote} -> spot exchange rate.
  fx: (base: string, quote: string) => getJson<FxRate>(`/api/fx/${base}/${quote}`),
  // GET /api/euribor/{tenor} -> monthly average Euribor rate.
  euribor: (tenor: string) => getJson<Envelope<Euribor>>(`/api/euribor/${tenor}`),
  // GET /api/bonds/{market}/{id} -> bond yield (and price when available).
  bond: (market: string, id: string) => getJson<Envelope<Bond>>(`/api/bonds/${market}/${id}`),
  // GET /api/stocks/{symbol} -> last price, daily change and volume. Symbol is URL-encoded.
  stock: (symbol: string) => getJson<Envelope<Stock>>(`/api/stocks/${encodeURIComponent(symbol)}`),
  // GET /api/commodities/{symbol} -> futures price with its unit.
  commodity: (symbol: string) => getJson<Envelope<Commodity>>(`/api/commodities/${symbol}`),
};
