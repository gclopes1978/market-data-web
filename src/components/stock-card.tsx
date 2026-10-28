import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatCompact, formatNumber, formatPercent } from "@/lib/format";
import { Async } from "@/components/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";

export function StockCard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [draft, setDraft] = useState("AAPL");
  const query = useQuery({ queryKey: ["stock", symbol], queryFn: () => api.stock(symbol), refetchInterval: 60_000 });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) setSymbol(draft.trim().toUpperCase());
  };

  return (
    <Card>
      <CardTitle>Ações</CardTitle>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          aria-label="Símbolo"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Símbolo, ex. MSFT"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="Pesquisar">
          <Search className="size-4" />
        </Button>
      </form>
      <div className="mt-5">
        <Async query={query}>
          {({ data, metadata }) => {
            const up = data.changePercent >= 0;
            return (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-medium">{data.name}</p>
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
