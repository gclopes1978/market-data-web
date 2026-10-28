import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient, stubFetch } from "@/test/utils";
import { EquityCard } from "./equity-card";

const quote = (symbol: string, name: string | null, price: number) => ({
  data: { symbol, name, price, currency: "USD", changePercent: 1.04, volume: 3600565 },
  metadata: { source: "Yahoo Finance", asOf: "2026-10-27" },
});

const routes = {
  "/api/stocks/AAPL": quote("AAPL", "Apple Inc.", 343.045),
  "/api/etfs/SPY": quote("SPY", "SPDR S&P 500 ETF Trust", 612.3),
  "/api/etfs/VWCE.DE": quote("VWCE.DE", null, 135.2), // some listings have no name
  "/api/etfs/QQQ": quote("QQQ", "Invesco QQQ Trust", 540.1),
};

afterEach(() => vi.unstubAllGlobals());

describe("EquityCard", () => {
  it("starts on stocks", async () => {
    stubFetch(routes);
    renderWithClient(<EquityCard />);
    expect(await screen.findByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stocks", pressed: true })).toBeInTheDocument();
  });

  it("switches to ETFs and loads the default ETF", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<EquityCard />);
    await screen.findByText("Apple Inc.");
    await userEvent.click(screen.getByRole("button", { name: "ETFs" }));
    expect(await screen.findByText("SPDR S&P 500 ETF Trust")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/etfs/SPY");
    expect(screen.getByLabelText("Symbol")).toHaveValue("SPY");
  });

  it("looks up an ETF symbol typed in lower case, falling back to the symbol when there is no name", async () => {
    stubFetch(routes);
    renderWithClient(<EquityCard />);
    await userEvent.click(screen.getByRole("button", { name: "ETFs" }));
    await userEvent.clear(screen.getByLabelText("Symbol"));
    await userEvent.type(screen.getByLabelText("Symbol"), "vwce.de{enter}");
    expect(await screen.findAllByText("VWCE.DE")).not.toHaveLength(0);
    expect(screen.getByText("135.20")).toBeInTheDocument();
  });

  it("loads an example chip with one click", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<EquityCard />);
    await userEvent.click(screen.getByRole("button", { name: "ETFs" }));
    await userEvent.click(screen.getByRole("button", { name: "QQQ" }));
    expect(await screen.findByText("Invesco QQQ Trust")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/etfs/QQQ");
  });

  it("remembers the symbol of each kind when switching back", async () => {
    stubFetch(routes);
    renderWithClient(<EquityCard />);
    await userEvent.click(screen.getByRole("button", { name: "ETFs" }));
    await userEvent.click(screen.getByRole("button", { name: "QQQ" }));
    await userEvent.click(screen.getByRole("button", { name: "Stocks" }));
    expect(screen.getByLabelText("Symbol")).toHaveValue("AAPL");
    await userEvent.click(screen.getByRole("button", { name: "ETFs" }));
    expect(screen.getByLabelText("Symbol")).toHaveValue("QQQ");
  });
});
