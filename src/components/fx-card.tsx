import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { CURRENCIES } from "@/lib/currencies";
import { formatDate, formatNumber } from "@/lib/format";
import { Async } from "@/components/async";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";

// Shared style for the native <select> elements.
const selectClass = "h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-2 text-sm";

// One <option> per world currency, shared by both selects: "EUR · Euro".
const currencyOptions = CURRENCIES.map((c) => (
  <option key={c.code} value={c.code}>
    {c.code} · {c.name}
  </option>
));

// The provider may not quote every pair; a 4xx from the API means "no rate for this pair", not a crash.
const describeFxError = (error: Error) =>
  error instanceof ApiError && [400, 404, 422].includes(error.status)
    ? "The data provider has no rate for this currency pair."
    : `Could not load data (${error.message}).`;

/**
 * FX card: pick a currency pair, swap it, and see the rate plus its inverse.
 *
 * Design note: the pair is part of the query key, so each pair is cached separately and swapping back
 * is instant. The inverse rate is computed locally (1 / rate) instead of making a second API call.
 */
export function FxCard() {
  const [base, setBase] = useState("EUR");
  const [quote, setQuote] = useState("USD");
  // Disabled when both currencies are equal (the API would reject that pair); refreshed every minute.
  const query = useQuery({
    queryKey: ["fx", base, quote],
    queryFn: () => api.fx(base, quote),
    enabled: base !== quote,
    refetchInterval: 60_000,
  });

  return (
    <Card>
      <CardTitle>Currency exchange</CardTitle>
      <div className="mt-3 flex items-center gap-2">
        <select aria-label="Base currency" className={selectClass} value={base} onChange={(e) => setBase(e.target.value)}>
          {currencyOptions}
        </select>
        <Button variant="ghost" size="icon" aria-label="Swap pair" onClick={() => { setBase(quote); setQuote(base); }}>
          <ArrowLeftRight className="size-4" />
        </Button>
        <select aria-label="Quote currency" className={selectClass} value={quote} onChange={(e) => setQuote(e.target.value)}>
          {currencyOptions}
        </select>
      </div>
      <div className="mt-5">
        {base === quote ? (
          <p className="text-sm text-muted-foreground">Choose two different currencies.</p>
        ) : (
          <Async query={query} describeError={describeFxError}>
            {(fx) => (
              <>
                <p className="text-4xl font-semibold tracking-tight">{formatNumber(fx.rate, 4)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  1 {fx.quote} = {formatNumber(1 / fx.rate, 4)} {fx.base}
                </p>
                <CardFooter>{fx.source} · {formatDate(fx.date)}</CardFooter>
              </>
            )}
          </Async>
        )}
      </div>
    </Card>
  );
}
