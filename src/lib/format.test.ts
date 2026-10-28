import { formatCompact, formatNumber, formatPercent } from "./format";

describe("format", () => {
  it("formats numbers with pt-PT separators", () => {
    expect(formatNumber(4039.8)).toBe("4039,80"); // pt-PT does not group 4-digit numbers
    expect(formatNumber(40398.5).replace(/\s/g, " ")).toBe("40 398,50");
  });
  it("adds a sign to positive percentages", () => {
    expect(formatPercent(1.0441826)).toBe("+1,04%");
    expect(formatPercent(-0.5)).toBe("-0,50%");
  });
  it("compacts large numbers", () => {
    expect(formatCompact(3600565)).toMatch(/3,6/);
  });
});
