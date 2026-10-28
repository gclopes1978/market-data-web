import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const euribor = (tenor: string, rate: number) => ({
  data: { tenor, rate, unit: "Percent per annum", frequency: "Monthly average" },
  metadata: { source: "ECB", asOf: "2026-09-01" },
});

const routes: Record<string, unknown> = {
  "/api/fx/EUR/USD": { base: "EUR", quote: "USD", rate: 1.1188, date: "2026-10-26", source: "Frankfurter" },
  "/api/euribor/1M": euribor("1M", 2.41),
  "/api/euribor/3M": euribor("3M", 2.63),
  "/api/euribor/6M": euribor("6M", 2.92),
  "/api/euribor/12M": euribor("12M", 3.25),
  "/api/bonds/US/US5Y": { data: { identifier: "US5Y", market: "US", price: null, currency: "USD", yield: 5.01, maturityDate: null }, metadata: { source: "U.S. Treasury", asOf: "2026-10-01" } },
  "/api/stocks/AAPL": { data: { symbol: "AAPL", name: "Apple Inc.", price: 343.045, currency: "USD", changePercent: 1.04, volume: 3600565 }, metadata: { source: "Yahoo", asOf: "2026-10-27" } },
};
for (const [s, name, price] of [["GOLD", "Gold futures", 4039.8], ["SILVER", "Silver futures", 53.93], ["WTI", "WTI crude oil futures", 101.3], ["BRENT", "Brent crude oil futures", 110.38], ["NATGAS", "Natural gas futures", 2.972]] as const) {
  routes[`/api/commodities/${s}`] = { data: { symbol: s, name, price, currency: "USD", unit: "USD" }, metadata: { source: "Yahoo", asOf: "2026-10-27" } };
}

function mockFetch(overrides: Record<string, Response> = {}) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (overrides[url]) return overrides[url];
    if (url === "/health") return new Response("Healthy");
    return routes[url] ? Response.json(routes[url]) : new Response("", { status: 404, statusText: "Not Found" });
  }));
}

const renderApp = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <App />
    </QueryClientProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe("Dashboard", () => {
  it("renders data from every section", async () => {
    mockFetch();
    renderApp();
    expect(await screen.findByText("API operacional")).toBeInTheDocument();
    expect(await screen.findByText("Apple Inc.")).toBeInTheDocument();
    expect(await screen.findByText("Gold futures")).toBeInTheDocument();
    expect(await screen.findByText("5,01%")).toBeInTheDocument();
    expect(await screen.findByLabelText("Curva Euribor por prazo")).toBeInTheDocument();
  });

  it("shows an error with retry when a request fails", async () => {
    mockFetch({ "/api/stocks/AAPL": new Response("", { status: 500, statusText: "Server Error" }) });
    renderApp();
    expect(await screen.findByRole("alert")).toHaveTextContent("500 Server Error");
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it("looks up another stock symbol", async () => {
    mockFetch();
    renderApp();
    await userEvent.clear(screen.getByLabelText("Símbolo"));
    await userEvent.type(screen.getByLabelText("Símbolo"), "msft{enter}");
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/stocks/MSFT"));
  });

  it("flags the API as unavailable", async () => {
    mockFetch({ "/health": new Response("", { status: 503 }) });
    renderApp();
    expect(await screen.findByText("API indisponível")).toBeInTheDocument();
  });
});
