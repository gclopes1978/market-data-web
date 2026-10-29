import { formatCompact, formatCryptoPrice, formatDate, formatNumber, formatPercent } from "./format";

describe("format", () => {
  it("formats numbers with thousands separators and a decimal point", () => {
    expect(formatNumber(4039.8)).toBe("4,039.80");
    expect(formatNumber(40398.5)).toBe("40,398.50");
  });
  it("adds a sign to positive percentages", () => {
    expect(formatPercent(1.0441826)).toBe("+1.04%");
    expect(formatPercent(-0.5)).toBe("-0.50%");
  });
  it("compacts large numbers", () => {
    expect(formatCompact(3600565)).toMatch(/3\.6/);
  });
});

describe("format edge cases", () => {
  it("respects the number of decimals", () => {
    expect(formatNumber(1.1188, 4)).toBe("1.1188");
    expect(formatNumber(2, 0)).toBe("2");
  });
  it("does not add a sign to zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });
  it("formats ISO dates in a localized short form", () => {
    expect(formatDate("2026-10-26")).toMatch(/26.*2026/);
  });
  it("gives crypto prices enough decimals for their size", () => {
    expect(formatCryptoPrice(93500.256)).toBe("93,500.26");
    expect(formatCryptoPrice(1)).toBe("1.00");
    expect(formatCryptoPrice(0.1234567)).toBe("0.1235");
    expect(formatCryptoPrice(0.0000125)).toBe("0.00001250");
  });
});
