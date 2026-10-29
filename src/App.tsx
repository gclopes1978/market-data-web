// Architecture overview
// - Each card owns its data: it calls TanStack Query hooks directly, so cards load, refresh and fail
//   independently (one slow or broken provider never blanks the whole page).
// - Server state (cache, polling, retries) lives in TanStack Query; the only local React state is UI input
//   (selected currencies, typed stock symbol).
// - src/lib/api.ts is the single place that knows URLs and response shapes.
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BondCard } from "@/components/bond-card";
import { CommoditiesCard } from "@/components/commodities-card";
import { CryptoCard } from "@/components/crypto-card";
import { EuriborCurve } from "@/components/euribor-curve";
import { FxCard } from "@/components/fx-card";
import { EquityCard } from "@/components/equity-card";

/** Badge showing whether the API answers /health (polled every 15s, no retries). */
function ApiStatus() {
  const { isError, isPending } = useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 15_000, retry: false });
  if (isPending) return <Badge>Checking API…</Badge>;
  return isError ? <Badge variant="down">API unavailable</Badge> : <Badge variant="up">API operational</Badge>;
}

/** Dashboard shell: header (status + refresh) and the grid of data cards. */
export default function App() {
  // Used by the refresh button to invalidate every query at once.
  const client = useQueryClient();
  // True while any query is loading; makes the refresh icon spin.
  const fetching = useIsFetching() > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Markets</h1>
          <p className="text-sm text-muted-foreground">Rates, currencies, stocks, crypto and commodities on one screen.</p>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatus />
          <Button variant="outline" onClick={() => client.invalidateQueries()}>
            <RefreshCw className={fetching ? "size-4 animate-spin" : "size-4"} /> Refresh
          </Button>
        </div>
      </header>
      <main className="grid gap-4 lg:grid-cols-3">
        <EuriborCurve />
        <FxCard />
        <EquityCard />
        <BondCard />
        <CryptoCard />
        <CommoditiesCard />
      </main>
    </div>
  );
}
