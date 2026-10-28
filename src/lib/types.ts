export interface Metadata { source: string; asOf: string }
export interface Envelope<T> { data: T; metadata: Metadata }

export interface FxRate { base: string; quote: string; rate: number; date: string; source: string }
export interface Euribor { tenor: string; rate: number; unit: string; frequency: string }
export interface Bond {
  identifier: string; market: string; price: number | null; currency: string;
  yield: number | null; maturityDate: string | null;
}
export interface Stock { symbol: string; name: string; price: number; currency: string; changePercent: number; volume: number }
export interface Commodity { symbol: string; name: string; price: number; currency: string; unit: string }
