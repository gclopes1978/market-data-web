import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatCompact, formatNumber, formatPercent } from "@/lib/format";
import { Async } from "@/components/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

type Kind = "stock" | "etf";

// Per-kind settings. Stocks and ETFs share the same response shape on the API, so one card serves both;
// only the endpoint, the starting symbol and the example chips differ.
const KINDS: Record<Kind, { label: string; fetch: typeof api.stock; symbol: string; examples: string[] }> = {
  stock: { label: "Stocks", fetch: api.stock, symbol: "AAPL", examples: ["AAPL", "MSFT", "NVDA", "SAP.DE"] },
  etf: { label: "ETFs", fetch: api.etf, symbol: "SPY", examples: ["SPY", "QQQ", "VWCE.DE", "IWDA.AS"] },
};

/**
 * Stocks & ETFs card: choose the kind, then look up any Yahoo Finance symbol.
 * Non-US listings need the exchange suffix (e.g. .DE Xetra, .AS Amsterdam, .L London).
 */
export function EquityCard() {
  const [kind, setKind] = useState<Kind>("stock");
  // Each kind remembers its own symbol, so switching tabs does not lose what you were looking at.
  const [symbols, setSymbols] = useState<Record<Kind, string>>({ stock: KINDS.stock.symbol, etf: KINDS.etf.symbol });
  // `draft` is the text box content; `symbols[kind]` is the committed value that goes into the query key.
  // Without this split we would call the API on every keystroke.
  const [draft, setDraft] = useState(KINDS.stock.symbol);

  const symbol = symbols[kind];
  const query = useQuery({
    queryKey: [kind, symbol],
    queryFn: () => KINDS[kind].fetch(symbol),
    refetchInterval: 60_000,
  });

  // Commits a symbol for the current kind (normalised to upper case) and syncs the text box.
  const commit = (value: string) => {
    const next = value.trim().toUpperCase();
    if (!next) return;
    setSymbols((prev) => ({ ...prev, [kind]: next }));
    setDraft(next);
  };

  const switchKind = (next: Kind) => {
    setKind(next);
    setDraft(symbols[next]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    commit(draft);
  };

  return (
    <Card>
      <CardTitle>Stocks &amp; ETFs</CardTitle>
      <div className="mt-3 flex gap-2" role="group" aria-label="Instrument type">
        {(Object.keys(KINDS) as Kind[]).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => switchKind(k)}>
            {KINDS[k].label}
          </Chip>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          aria-label="Symbol"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={kind === "etf" ? "ETF symbol, e.g. VWCE.DE" : "Stock symbol, e.g. MSFT"}
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="Search">
          <Search className="size-4" />
        </Button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Examples">
        {KINDS[kind].examples.map((example) => (
          <Chip key={example} active={symbol === example} onClick={() => commit(example)}>
            {example}
          </Chip>
        ))}
      </div>
      <div className="mt-5">
        <Async query={query}>
          {({ data, metadata }) => {
            const up = data.changePercent >= 0;
            return (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  {/* Some listings come without a name; fall back to the symbol. */}
                  <p className="truncate font-medium">{data.name ?? data.symbol}</p>
                  <span className="text-xs text-muted-foreground">{data.symbol}</span>
                </div>
                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {formatNumber(data.price)} <span className="text-base font-normal text-muted-foreground">{data.currency}</span>
                </p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <Badge variant={up ? "up" : "down"}>
                    {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {formatPercent(data.changePercent)}
                  </Badge>
                  <span className="text-muted-foreground">Volume {formatCompact(data.volume)}</span>
                </div>
                <CardFooter>{metadata.source}</CardFooter>
              </>
            );
          }}
        </Async>
      </div>
    </Card>
  );
}
