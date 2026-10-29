import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { api, CRYPTO_CURRENCIES, type CryptoCurrency } from "@/lib/api";
import { formatCompact, formatCryptoPrice, formatPercent } from "@/lib/format";
import { Async } from "@/components/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

/** Quick picks: provider id + label. The id is what the API expects (see GET /api/crypto). */
const EXAMPLES = [
  { id: "btc-bitcoin", label: "BTC" },
  { id: "eth-ethereum", label: "ETH" },
  { id: "sol-solana", label: "SOL" },
  { id: "xrp-xrp", label: "XRP" },
] as const;

const SUGGESTIONS = 8;

/**
 * Crypto lookup: search any listed cryptocurrency by name or symbol and see its quote in USD or EUR.
 * With an empty search box the dropdown shows the top coins by market cap.
 */
export function CryptoCard() {
  const [selectedId, setSelectedId] = useState<string>(EXAMPLES[0].id);
  const [currency, setCurrency] = useState<CryptoCurrency>("USD");
  const [draft, setDraft] = useState("Bitcoin");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");

  // Debounce what the user types so the API is not called on every keystroke.
  useEffect(() => {
    const value = draft.trim();
    const timeout = window.setTimeout(() => setDebounced(value), 300);
    return () => window.clearTimeout(timeout);
  }, [draft]);

  const quote = useQuery({
    queryKey: ["crypto", selectedId, currency],
    queryFn: () => api.crypto(selectedId, currency),
    refetchInterval: 60_000,
  });

  const search = useQuery({
    queryKey: ["crypto-search", debounced],
    queryFn: () => api.cryptoAssets(debounced, SUGGESTIONS),
    enabled: open,
  });

  const select = (id: string, label: string) => {
    setSelectedId(id);
    setDraft(label);
    setDebounced("");
    setOpen(false);
  };

  const results = search.data?.data ?? [];

  return (
    <Card>
      <CardTitle>Crypto</CardTitle>

      <div className="mt-3 flex gap-2" role="group" aria-label="Currency">
        {CRYPTO_CURRENCIES.map((c) => (
          <Chip key={c} active={currency === c} onClick={() => setCurrency(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="relative mt-3">
        <label htmlFor="crypto-picker" className="mb-1 block text-sm font-medium">Choose a cryptocurrency</label>
        <div className="flex gap-2">
          <input
            id="crypto-picker"
            aria-label="Cryptocurrency"
            role="combobox"
            aria-expanded={open}
            aria-controls="crypto-search-results"
            value={draft}
            onFocus={(e) => {
              e.currentTarget.select();
              setDebounced("");
              setOpen(true);
            }}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                const first = results[0];
                if (first) select(first.id, first.name);
              }
            }}
            placeholder="Search by name or symbol, e.g. Solana"
            autoComplete="off"
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
          />
          <Button type="button" variant="outline" size="icon" aria-label="Show cryptocurrencies" onClick={() => setOpen((o) => !o)}>
            <Search className="size-4" />
          </Button>
        </div>

        {open && (
          <div
            id="crypto-search-results"
            role="listbox"
            aria-label="Available cryptocurrencies"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
          >
            {search.isFetching && <p className="px-3 py-2 text-sm text-muted-foreground">Searching cryptocurrencies...</p>}
            {search.isError && <p className="px-3 py-2 text-sm text-muted-foreground">Error searching cryptocurrencies.</p>}
            {!search.isFetching && !search.isError && search.data && results.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No cryptocurrencies found.</p>
            )}
            {!search.isFetching && !debounced && results.length > 0 && (
              <p className="px-3 pt-2 text-xs text-muted-foreground">Top by market cap</p>
            )}
            {results.map((asset) => (
              <button
                key={asset.id}
                type="button"
                role="option"
                aria-selected={asset.id === selectedId}
                onClick={() => select(asset.id, asset.name)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{asset.name}</span>
                  {asset.rank !== null && <span className="block text-xs text-muted-foreground">Rank #{asset.rank}</span>}
                </span>
                <span className="shrink-0 font-mono text-xs">{asset.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Examples">
        {EXAMPLES.map((example) => (
          <Chip key={example.id} active={selectedId === example.id} onClick={() => select(example.id, example.label)}>
            {example.label}
          </Chip>
        ))}
      </div>

      <div className="mt-5">
        <Async
          query={quote}
          describeError={(error) =>
            error.message.startsWith("404") ? "This cryptocurrency has no quote available." : `Could not load data (${error.message}).`
          }
        >
          {({ data, metadata }) => {
            const change = data.changePercent24h;
            const up = (change ?? 0) >= 0;

            return (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-medium">{data.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {data.symbol}
                    {data.rank !== null && ` · #${data.rank}`}
                  </span>
                </div>
                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {formatCryptoPrice(data.price)}{" "}
                  <span className="text-base font-normal text-muted-foreground">{data.currency}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {change !== null && (
                    <Badge variant={up ? "up" : "down"}>
                      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {formatPercent(change)} 24h
                    </Badge>
                  )}
                  {data.volume24h !== null && <span className="text-muted-foreground">Vol. {formatCompact(data.volume24h)}</span>}
                  {data.marketCap !== null && <span className="text-muted-foreground">Mkt cap {formatCompact(data.marketCap)}</span>}
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
