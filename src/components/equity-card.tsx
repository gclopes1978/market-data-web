import { useEffect, useState } from "react";
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

const KINDS: Record<Kind, { label: string; fetch: typeof api.stock; symbol: string; examples: string[] }> = {
  stock: { label: "Stocks", fetch: api.stock, symbol: "AAPL", examples: ["AAPL", "MSFT", "NVDA", "SAP.DE"] },
  etf: { label: "ETFs", fetch: api.etf, symbol: "SPY", examples: ["SPY", "QQQ", "VWCE.DE", "IWDA.AS"] },
};

export function EquityCard() {
  const [kind, setKind] = useState<Kind>("stock");
  const [symbols, setSymbols] = useState<Record<Kind, string>>({
    stock: KINDS.stock.symbol,
    etf: KINDS.etf.symbol,
  });
  const [draft, setDraft] = useState(KINDS.stock.symbol);
  const [stockPickerOpen, setStockPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const value = searchTerm.trim();

    if (value.length < 2) {
      setDebouncedSearch("");
      return;
    }

    const timeout = window.setTimeout(() => setDebouncedSearch(value), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const symbol = symbols[kind];

  const query = useQuery({
    queryKey: [kind, symbol],
    queryFn: () => KINDS[kind].fetch(symbol),
    refetchInterval: 60_000,
  });

  const stockSearch = useQuery({
    queryKey: ["stock-search", debouncedSearch],
    queryFn: () => api.searchStocks(debouncedSearch),
    enabled: kind === "stock" && debouncedSearch.length >= 2,
  });

  const commit = (value: string) => {
    const next = value.trim().toUpperCase();
    if (!next) return;

    setSymbols((prev) => ({ ...prev, [kind]: next }));
    setDraft(next);
    setSearchTerm("");
    setDebouncedSearch("");
  };

  const switchKind = (next: Kind) => {
    setKind(next);
    setDraft(symbols[next]);
    setSearchTerm("");
    setDebouncedSearch("");
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


      <div className="relative mt-3">
        <label htmlFor="stock-picker" className="mb-1 block text-sm font-medium">
          {kind === "stock" ? "Choose a stock" : "ETF symbol"}
        </label>

        <div className="flex gap-2">
          <input
            id="stock-picker"
            aria-label="Symbol"
            role="combobox"
            aria-expanded={kind === "stock" && stockPickerOpen}
            aria-controls="stock-search-results"
            value={draft}
            onFocus={() => {
              if (kind === "stock") setStockPickerOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                if (kind === "etf") {
                  commit(draft);
                  return;
                }

                const exactSymbol = stockSearch.data?.find(
                  (result) => result.symbol.toUpperCase() === draft.trim().toUpperCase()
                );

                if (exactSymbol) {
                  commit(exactSymbol.symbol);
                  setStockPickerOpen(false);
                } else if (/^[a-zA-Z0-9.^=_-]+$/.test(draft.trim())) {
                  commit(draft);
                  setStockPickerOpen(false);
                }
              }
            }}
            onChange={(e) => {
              setDraft(e.target.value);
              setSearchTerm(kind === "stock" ? e.target.value : "");
              if (kind === "stock") setStockPickerOpen(true);
            }}
            placeholder={kind === "etf" ? "ETF symbol, e.g. VWCE.DE" : "Pesquisar empresa ou ação..."}
            autoComplete="off"
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
          />
          <Button type="button" variant="outline" size="icon" aria-label="Mostrar ações"
            onClick={() => {
              if (kind === "stock") setStockPickerOpen((open) => !open);
              else commit(draft);
            }}>
            <Search className="size-4" />
          </Button>
        </div>

        {kind === "stock" && stockPickerOpen && (
          <div id="stock-search-results" role="listbox" aria-label="Ações disponíveis"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {debouncedSearch.length < 2 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Type at least 2 letters to search for stocks by company name. Results will appear here.
              </p>
            )}

            {debouncedSearch.length >= 2 && stockSearch.isFetching && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Searching for stocks...</p>
            )}

            {debouncedSearch.length >= 2 && !stockSearch.isFetching && stockSearch.data?.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No stocks found.</p>
            )}

            {stockSearch.isError && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Error searching for stocks.</p>
            )}

            {stockSearch.data?.map((result) => (
              <button key={`${result.symbol}-${result.exchange ?? ""}`} type="button" role="option"
                aria-selected={symbol === result.symbol}
                onClick={() => {
                  commit(result.symbol);
                  setStockPickerOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{result.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {result.exchangeName ?? result.exchange ?? "Bolsa indisponível"}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs">{result.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>


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
                  <p className="truncate font-medium">{data.name ?? data.symbol}</p>
                  <span className="text-xs text-muted-foreground">{data.symbol}</span>
                </div>
                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {formatNumber(data.price)}{" "}
                  <span className="text-base font-normal text-muted-foreground">{data.currency}</span>
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
