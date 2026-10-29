// Design note: every URL below is relative ("/api/..."), i.e. same-origin.
// - In development Vite proxies /api and /health to the API (see vite.config.ts).
// - In production Nginx does the same (see nginx/default.conf.template).
// So the frontend never hard-codes a host or port, and the browser never needs CORS.
import type { Bond, Commodity, CryptoAsset, CryptoQuote, Envelope, Euribor, FxRate, Stock, StockSearchResult } from "./types";

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

// Options offered by the UI: Euribor tenors and commodity symbols (currencies live in currencies.ts).
export const TENORS = ["1M", "3M", "6M", "12M"] as const;
export const COMMODITIES = ["GOLD", "SILVER", "WTI", "BRENT", "NATGAS"] as const;
export const CRYPTO_CURRENCIES = ["USD", "EUR"] as const;
export type CryptoCurrency = (typeof CRYPTO_CURRENCIES)[number];

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
    // GET /api/stocks/search?q={query} -> search stocks by company name or symbol.
  searchStocks: (query: string) => getJson<StockSearchResult[]>(`/api/stocks/search?q=${encodeURIComponent(query)}`),
  // GET /api/etfs/{symbol} -> same payload as a stock; Yahoo Finance symbols (e.g. SPY, VWCE.DE).
  etf: (symbol: string) => getJson<Envelope<Stock>>(`/api/etfs/${encodeURIComponent(symbol)}`),
  // GET /api/commodities/{symbol} -> futures price with its unit.
  commodity: (symbol: string) => getJson<Envelope<Commodity>>(`/api/commodities/${symbol}`),
  // GET /api/crypto?q=&limit= -> active cryptocurrencies by market-cap rank, optionally filtered by name or symbol.
  cryptoAssets: (query = "", limit?: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return getJson<Envelope<CryptoAsset[]>>(`/api/crypto${qs ? `?${qs}` : ""}`);
  },
  // GET /api/crypto/{id}?currency= -> latest quote; id is the provider id (e.g. btc-bitcoin).
  crypto: (id: string, currency = "USD") =>
    getJson<Envelope<CryptoQuote>>(`/api/crypto/${encodeURIComponent(id)}?currency=${currency}`),
};
