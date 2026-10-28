import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { Async } from "@/components/async";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";

/** Bond card: US 5-year Treasury yield. The source is daily, so it is cached for an hour. */
export function BondCard() {
  const query = useQuery({ queryKey: ["bond", "US", "US5Y"], queryFn: () => api.bond("US", "US5Y"), staleTime: 60 * 60_000 });
  return (
    <Card>
      <CardTitle>Obrigações do Tesouro dos EUA a 5 anos</CardTitle>
      <div className="mt-5">
        <Async query={query}>
          {({ data, metadata }) => (
            <>
              <p className="text-4xl font-semibold tracking-tight">
                {data.yield != null ? `${formatNumber(data.yield)}%` : "—"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Yield · preço {data.price != null ? formatNumber(data.price) : "indisponível"}
              </p>
              <CardFooter>{metadata.source} · {formatDate(metadata.asOf)}</CardFooter>
            </>
          )}
        </Async>
      </div>
    </Card>
  );
}
