// All numbers and dates are rendered with European Portuguese conventions.
const LOCALE = "pt-PT";

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
