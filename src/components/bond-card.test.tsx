import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient, stubFetch } from "@/test/utils";
import { BondCard } from "./bond-card";

const bond = (identifier: string, market: string, yieldPct: number, source: string) => ({
  data: { identifier, market, price: null, currency: market === "US" ? "USD" : "EUR", yield: yieldPct, maturityDate: null },
  metadata: { source, asOf: "2026-10-27" },
});

const routes = {
  "/api/bonds/US/US10Y": bond("US10Y", "US", 4.3, "U.S. Treasury"),
  "/api/bonds/US/US2Y": bond("US2Y", "US", 3.9, "U.S. Treasury"),
  "/api/bonds/EUR/EUR10Y": bond("EUR10Y", "EUR", 2.91, "ECB"),
};

afterEach(() => vi.unstubAllGlobals());

describe("BondCard", () => {
  it("shows the US 10-year yield by default", async () => {
    stubFetch(routes);
    renderWithClient(<BondCard />);
    expect(await screen.findByText("4.30%")).toBeInTheDocument();
    expect(screen.getByText(/price unavailable/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10Y", pressed: true })).toBeInTheDocument();
  });

  it("loads another maturity from its chip", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<BondCard />);
    await userEvent.click(screen.getByRole("button", { name: "2Y" }));
    expect(await screen.findByText("3.90%")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/bonds/US/US2Y");
  });

  it("switches to the euro area and keeps the maturity when it exists there", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<BondCard />);
    await userEvent.click(screen.getByRole("button", { name: "Euro area" }));
    expect(await screen.findByText("2.91%")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/bonds/EUR/EUR10Y");
    expect(screen.getByText(/ECB euro area AAA/)).toBeInTheDocument();
  });

  it("falls back to the default maturity when the new market lacks the selected one", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<BondCard />);
    await userEvent.click(screen.getByRole("button", { name: "1M" })); // exists for the US only
    await userEvent.click(screen.getByRole("button", { name: "Euro area" }));
    expect(await screen.findByText("2.91%")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/bonds/EUR/EUR10Y");
    expect(screen.queryByRole("button", { name: "1M" })).not.toBeInTheDocument();
  });

  it("explains a market the API cannot serve yet (503)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503, statusText: "Service Unavailable" })));
    renderWithClient(<BondCard />);
    expect(await screen.findByRole("alert")).toHaveTextContent("not available on the API yet");
  });

  it("explains a maturity without data (404)", async () => {
    stubFetch({}); // every URL answers 404
    renderWithClient(<BondCard />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No yield is available for this maturity");
  });
});
