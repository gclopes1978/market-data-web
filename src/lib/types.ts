// Response shapes of the Market Data API.
export interface Metadata { source: string; asOf: string }
/** Wrapper used by most endpoints: payload in `data`, provenance in `metadata`. */
export interface Envelope<T> { data: T; metadata: Metadata }

/** FX endpoint returns a flat object (no envelope). */
export interface FxRate { base: string; quote: string; rate: number; date: string; source: string }
/** Euribor rate in percent per annum for a given tenor. */
export interface Euribor { tenor: string; rate: number; unit: string; frequency: string }
/** Bond quote; price, yield and maturity may be null when the source does not provide them. */
export interface Bond {
  identifier: string; market: string; price: number | null; currency: string;
  yield: number | null; maturityDate: string | null;
}
/** Stock or ETF quote (same shape); the name can be missing for some listings; changePercent is the daily change in percent. */
export interface Stock { symbol: string; name: string | null; price: number; currency: string; changePercent: number; volume: number }
/** Commodity futures quote with the unit it is priced in. */
export interface Commodity { symbol: string; name: string; price: number; currency: string; unit: string }
/** Stock search result returned by Yahoo Finance; ETFs are excluded by the API. */
export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string | null;
  exchangeName: string | null;
}