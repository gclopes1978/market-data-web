import { BOND_MARKETS, BOND_MARKET_KEYS } from "./bonds";

describe("bond catalog", () => {
  it("builds the identifiers the API expects", () => {
    expect(BOND_MARKETS.US.identifier("10Y")).toBe("US10Y");
    expect(BOND_MARKETS.EUR.identifier("3M")).toBe("EUR3M");
  });
  it("offers each market's default maturity in its own list", () => {
    for (const key of BOND_MARKET_KEYS) {
      expect(BOND_MARKETS[key].maturities).toContain(BOND_MARKETS[key].maturity);
    }
  });
  it("has no duplicate maturities", () => {
    for (const key of BOND_MARKET_KEYS) {
      const list = BOND_MARKETS[key].maturities;
      expect(new Set(list).size).toBe(list.length);
    }
  });
});
