// Bond catalog: the markets and maturities offered in the UI.
// The lists mirror what market-data-api accepts (GET /api/bonds/{market}/{identifier}); keeping them here,
// in one place, means adding a market or maturity is a data change and no component needs to be touched.

export type BondMarket = "US" | "EUR";

export interface BondMarketConfig {
  /** Short name shown on the market toggle. */
  label: string;
  /** What the numbers really are; shown under the yield so the data is not misread as a single bond. */
  description: string;
  /** Maturities offered as chips, shortest first. */
  maturities: readonly string[];
  maturity: string;
  /** Builds the identifier the API expects from a maturity, e.g. "10Y" -> "US10Y". */
  identifier: (maturity: string) => string;
}

export const BOND_MARKETS: Record<BondMarket, BondMarketConfig> = {
  US: {
    label: "US Treasury",
    description: "U.S. Treasury par yield curve",
    maturities: ["1M", "3M", "6M", "1Y", "2Y", "5Y", "7Y", "10Y", "20Y", "30Y"],
    maturity: "10Y",
    identifier: (maturity) => `US${maturity}`,
  },
  EUR: {
    label: "Euro area",
    // The ECB publishes a fitted yield curve on AAA-rated government bonds, not individual bonds.
    description: "ECB euro area AAA government bond yield curve",
    maturities: ["3M", "6M", "1Y", "2Y", "5Y", "7Y", "10Y", "20Y", "30Y"],
    maturity: "10Y",
    identifier: (maturity) => `EUR${maturity}`,
  },
};

export const BOND_MARKET_KEYS = Object.keys(BOND_MARKETS) as BondMarket[];
