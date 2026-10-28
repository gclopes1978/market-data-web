import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { api, CURRENCIES } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { Async } from "@/components/async";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";

// Shared style for the native <select> elements.
const selectClass = "h-9 rounded-lg border border-border bg-card px-2 text-sm";

/** FX card: pick a currency pair, swap it, and see the rate plus its inverse. */
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
      <CardTitle>Câmbio</CardTitle>
      <div className="mt-3 flex items-center gap-2">
        <select aria-label="Moeda base" className={selectClass} value={base} onChange={(e) => setBase(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Button variant="ghost" size="icon" aria-label="Inverter par" onClick={() => { setBase(quote); setQuote(base); }}>
          <ArrowLeftRight className="size-4" />
        </Button>
        <select aria-label="Moeda cotada" className={selectClass} value={quote} onChange={(e) => setQuote(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="mt-5">
        {base === quote ? (
          <p className="text-sm text-muted-foreground">Escolha duas moedas diferentes.</p>
        ) : (
          <Async query={query}>
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
