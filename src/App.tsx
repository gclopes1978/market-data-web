import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BondCard } from "@/components/bond-card";
import { CommoditiesCard } from "@/components/commodities-card";
import { EuriborCurve } from "@/components/euribor-curve";
import { FxCard } from "@/components/fx-card";
import { StockCard } from "@/components/stock-card";

function ApiStatus() {
  const { isError, isPending } = useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 15_000, retry: false });
  if (isPending) return <Badge>A verificar API…</Badge>;
  return isError ? <Badge variant="down">API indisponível</Badge> : <Badge variant="up">API operacional</Badge>;
}

export default function App() {
  const client = useQueryClient();
  const fetching = useIsFetching() > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mercados</h1>
          <p className="text-sm text-muted-foreground">Taxas, câmbio, ações e matérias-primas num só ecrã.</p>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatus />
          <Button variant="outline" onClick={() => client.invalidateQueries()}>
            <RefreshCw className={fetching ? "size-4 animate-spin" : "size-4"} /> Atualizar
          </Button>
        </div>
      </header>
      <main className="grid gap-4 lg:grid-cols-3">
        <EuriborCurve />
        <FxCard />
        <StockCard />
        <BondCard />
        <CommoditiesCard />
      </main>
    </div>
  );
}
