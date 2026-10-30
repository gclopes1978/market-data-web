// All numbers and dates are rendered with British English conventions (1,234.50).
const LOCALE = "en-GB";

/** Formats a number with a fixed number of decimals (default 2), e.g. 4039.8 -> "4039,80". */
export const formatNumber = (n: number, digits = 2) =>
  new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

/** Formats a percentage with an explicit "+" for positive values, e.g. 1.04 -> "+1,04%". */
export const formatPercent = (n: number, digits = 2) => `${n > 0 ? "+" : ""}${formatNumber(n, digits)}%`;

/** Formats large numbers in compact notation, e.g. 3600565 -> "3,6 M". */
export const formatCompact = (n: number) =>
  new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Formats an ISO date (YYYY-MM-DD) as a short localized date. */
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

/** Price with enough decimals for tiny values: >= 1 -> 2 decimals, >= 0.01 -> 4, below -> 8 (e.g. 0.00001250). */
export const formatCryptoPrice = (n: number) => formatNumber(n, n >= 1 ? 2 : n >= 0.01 ? 4 : 8);
