import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { BOND_MARKET_KEYS, BOND_MARKETS, type BondMarket } from "@/lib/bonds";
import { formatDate, formatNumber } from "@/lib/format";
import { Async } from "@/components/async";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

// 503 = the API has no provider for this market; 400/404 = no yield for this maturity.
// Both are expected situations, not crashes, so they get plain-language messages.
const describeBondError = (error: Error) => {
  if (error instanceof ApiError) {
    if (error.status === 503) return "This bond market is not available on the API yet.";
    if ([400, 404, 422].includes(error.status)) return "No yield is available for this maturity.";
  }
  return `Could not load data (${error.message}).`;
};

/**
 * Government bond yields: pick a market (US Treasury or euro area) and a maturity.
 * What is offered comes from src/lib/bonds.ts, so this component has no market-specific logic.
 */
export function BondCard() {
  const [market, setMarket] = useState<BondMarket>("US");
  const [maturity, setMaturity] = useState(BOND_MARKETS.US.maturity);

  const config = BOND_MARKETS[market];
  const identifier = config.identifier(maturity);
  const query = useQuery({
    queryKey: ["bond", market, identifier],
    queryFn: () => api.bond(market, identifier),
    staleTime: 60 * 60_000, // yield curves are published once per business day
  });

  // Switching market keeps the chosen maturity when the new market has it (10Y stays 10Y),
  // otherwise falls back to that market's default (a 1M chip does not exist for the euro area).
  const switchMarket = (next: BondMarket) => {
    setMarket(next);
    if (!BOND_MARKETS[next].maturities.includes(maturity)) setMaturity(BOND_MARKETS[next].maturity);
  };

  return (
    <Card>
      <CardTitle>Government bonds</CardTitle>
      <div className="mt-3 flex gap-2" role="group" aria-label="Bond market">
        {BOND_MARKET_KEYS.map((key) => (
          <Chip key={key} active={market === key} onClick={() => switchMarket(key)}>
            {BOND_MARKETS[key].label}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Maturity">
        {config.maturities.map((m) => (
          <Chip key={m} active={maturity === m} onClick={() => setMaturity(m)}>
            {m}
          </Chip>
        ))}
      </div>
      <div className="mt-5">
        <Async query={query} describeError={describeBondError}>
          {({ data, metadata }) => (
            <>
              <p className="text-4xl font-semibold tracking-tight">
                {data.yield != null ? `${formatNumber(data.yield)}%` : "—"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {config.label} {maturity} yield · price {data.price != null ? formatNumber(data.price) : "unavailable"}
              </p>
              <CardFooter>
                {config.description} · {formatDate(metadata.asOf)}
              </CardFooter>
            </>
          )}
        </Async>
      </div>
    </Card>
  );
}
