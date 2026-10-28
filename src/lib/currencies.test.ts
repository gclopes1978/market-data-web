import { CURRENCIES, CURRENCY_CODES, currencyName } from "./currencies";

describe("currencies", () => {
  it("offers the world's currencies", () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(150);
    expect(CURRENCY_CODES).toEqual(expect.arrayContaining(["EUR", "USD", "JPY", "GBP", "BRL", "ZAR"]));
  });
  it("has unique, well-formed ISO codes", () => {
    expect(new Set(CURRENCY_CODES).size).toBe(CURRENCY_CODES.length);
    for (const code of CURRENCY_CODES) expect(code).toMatch(/^[A-Z]{3}$/);
  });
  it("resolves English names and falls back to the code", () => {
    expect(currencyName("EUR")).toBe("Euro");
    expect(currencyName("not-a-code")).toBe("not-a-code");
  });
});
