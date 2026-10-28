const LOCALE = "pt-PT";

export const formatNumber = (n: number, digits = 2) =>
  new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export const formatPercent = (n: number, digits = 2) => `${n > 0 ? "+" : ""}${formatNumber(n, digits)}%`;

export const formatCompact = (n: number) =>
  new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
