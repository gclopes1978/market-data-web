import { useQueries } from "@tanstack/react-query";
import { api, COMMODITIES } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Commodities list: one row per symbol; each row loads and fails independently. */
export function CommoditiesCard() {
  // One query per commodity, refreshed every minute.
  const results = useQueries({
    queries: COMMODITIES.map((s) => ({ queryKey: ["commodity", s], queryFn: () => api.commodity(s), refetchInterval: 60_000 })),
  });

  return (
    <Card className="lg:col-span-3">
      <CardTitle>Matérias-primas</CardTitle>
      <ul className="mt-3 divide-y divide-border">
        {results.map((r, i) => (
          <li key={COMMODITIES[i]} className="flex items-center justify-between gap-4 py-3">
            {r.data ? (
              <>
                <div>
                  <p className="font-medium">{r.data.data.name}</p>
                  <p className="text-xs text-muted-foreground">{r.data.data.unit}</p>
                </div>
                <p className="text-lg font-semibold">{formatNumber(r.data.data.price)}</p>
              </>
            ) : r.isError ? (
              <p role="alert" className="text-sm text-down">{COMMODITIES[i]}: erro ao carregar ({r.error.message})</p>
            ) : (
              <Skeleton className="h-10 w-full" />
            )}
          </li>
        ))}
      </ul>
      <CardFooter>Futuros · Yahoo Finance (endpoint não oficial)</CardFooter>
    </Card>
  );
}
