import type { Bond, Commodity, Envelope, Euribor, FxRate, Stock } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request(path: string): Promise<Response> {
  const res = await fetch(path);
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`.trim());
  return res;
}

const getJson = async <T,>(path: string) => (await request(path)).json() as Promise<T>;

export const TENORS = ["1M", "3M", "6M", "12M"] as const;
export const COMMODITIES = ["GOLD", "SILVER", "WTI", "BRENT", "NATGAS"] as const;
export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY"] as const;

export const api = {
  health: async () => (await request("/health")).text(),
  fx: (base: string, quote: string) => getJson<FxRate>(`/api/fx/${base}/${quote}`),
  euribor: (tenor: string) => getJson<Envelope<Euribor>>(`/api/euribor/${tenor}`),
  bond: (market: string, id: string) => getJson<Envelope<Bond>>(`/api/bonds/${market}/${id}`),
  stock: (symbol: string) => getJson<Envelope<Stock>>(`/api/stocks/${encodeURIComponent(symbol)}`),
  commodity: (symbol: string) => getJson<Envelope<Commodity>>(`/api/commodities/${symbol}`),
};
