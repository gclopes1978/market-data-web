import { useQueries } from "@tanstack/react-query";
import { api, TENORS } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// SVG geometry (viewBox units): canvas size, horizontal padding and vertical margins.
const W = 600, H = 220, PAD_X = 50, TOP = 40, BOTTOM = 40;

/** Hero card: draws the Euribor term structure (1M-12M) as a responsive SVG line chart. */
export function EuriborCurve() {
  // One query per tenor, fetched in parallel. Euribor is a monthly average, so it is cached for an hour.
  const results = useQueries({
    queries: TENORS.map((t) => ({
      queryKey: ["euribor", t],
      queryFn: () => api.euribor(t),
      staleTime: 60 * 60_000,
    })),
  });

  // Derived UI state: first failed query (if any) and whether every tenor has loaded.
  const failed = results.find((r) => r.isError);
  const ready = results.every((r) => r.data);
  // Chart points in tenor order; rate is 0 until loaded (never drawn in that case).
  const points = results.map((r, i) => ({ tenor: TENORS[i], rate: r.data?.data.rate ?? 0 }));
  const asOf = results[0].data?.metadata.asOf;

  const rates = points.map((p) => p.rate);
  // Y scale bounds; `span` falls back to 1 to avoid dividing by zero when all rates are equal.
  const min = Math.min(...rates), max = Math.max(...rates);
  const span = max - min || 1;
  // Maps a point index to an X coordinate, evenly spaced between the padding.
  const x = (i: number) => PAD_X + (i * (W - 2 * PAD_X)) / (points.length - 1);
  // Maps a rate to a Y coordinate (higher rate = higher on screen).
  const y = (r: number) => TOP + (1 - (r - min) / span) * (H - TOP - BOTTOM);
  // SVG path for the line, and a closed path used for the soft area fill under it.
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.rate)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${H - BOTTOM} L${x(0)},${H - BOTTOM} Z`;

  return (
    <Card className="lg:col-span-2">
      <CardTitle>Curva Euribor</CardTitle>
      {failed ? (
        <p role="alert" className="mt-4 text-sm text-down">Não foi possível carregar a curva ({failed.error?.message}).</p>
      ) : !ready ? (
        <Skeleton className="mt-4 h-56 w-full" />
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" className="mt-2 w-full" aria-label="Curva Euribor por prazo">
            <path d={area} fill="var(--primary)" opacity="0.12" />
            <path d={line} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={p.tenor}>
                <circle cx={x(i)} cy={y(p.rate)} r="5" fill="var(--card)" stroke="var(--primary)" strokeWidth="3" />
                <text x={x(i)} y={y(p.rate) - 14} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--foreground)">
                  {formatNumber(p.rate)}%
                </text>
                <text x={x(i)} y={H - 14} textAnchor="middle" fontSize="13" fill="var(--muted-foreground)">
                  {p.tenor}
                </text>
              </g>
            ))}
          </svg>
          <CardFooter>
            Média mensal, BCE{asOf ? ` · referente a ${formatDate(asOf)}` : ""}
          </CardFooter>
        </>
      )}
    </Card>
  );
}
