import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient, stubFetch } from "@/test/utils";
import { CryptoCard } from "./crypto-card";

const quote = (id: string, symbol: string, name: string, price: number, currency = "USD", extra: object = {}) => ({
  data: { id, symbol, name, price, currency, changePercent24h: -1.37, volume24h: 31_000_000_000, marketCap: 1_850_000_000_000, rank: 1, ...extra },
  metadata: { source: "CoinPaprika", asOf: "2026-10-29" },
});

const assets = (...items: [string, string, string, number | null][]) => ({
  data: items.map(([id, name, symbol, rank]) => ({ id, name, symbol, rank, type: "coin" })),
  metadata: { source: "CoinPaprika", asOf: "2026-10-29" },
});

const routes = {
  "/api/crypto/btc-bitcoin?currency=USD": quote("btc-bitcoin", "BTC", "Bitcoin", 93500.25),
  "/api/crypto/btc-bitcoin?currency=EUR": quote("btc-bitcoin", "BTC", "Bitcoin", 80100.5, "EUR"),
  "/api/crypto/eth-ethereum?currency=USD": quote("eth-ethereum", "ETH", "Ethereum", 3200.1, "USD", { changePercent24h: 2.5, rank: 2 }),
  "/api/crypto/shib-shiba-inu?currency=USD": quote("shib-shiba-inu", "SHIB", "Shiba Inu", 0.0000125, "USD", { changePercent24h: null, volume24h: null, marketCap: null, rank: null }),
};

afterEach(() => vi.unstubAllGlobals());

describe("CryptoCard", () => {
  it("loads Bitcoin in USD by default", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<CryptoCard />);
    expect(await screen.findByText("93,500.25")).toBeInTheDocument();
    expect(screen.getByText("BTC · #1")).toBeInTheDocument();
    expect(screen.getByText("-1.37% 24h")).toBeInTheDocument();
    expect(screen.getByText("Vol. 31bn")).toBeInTheDocument();
    expect(screen.getByText("Mkt cap 1.9tn")).toBeInTheDocument();
    expect(screen.getByText("CoinPaprika")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/crypto/btc-bitcoin?currency=USD");
    expect(screen.getByRole("button", { name: "USD", pressed: true })).toBeInTheDocument();
  });

  it("switches the quote currency to EUR", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<CryptoCard />);
    await screen.findByText("93,500.25");
    await userEvent.click(screen.getByRole("button", { name: "EUR" }));
    expect(await screen.findByText("80,100.50")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/crypto/btc-bitcoin?currency=EUR");
    expect(screen.getByRole("button", { name: "EUR", pressed: true })).toBeInTheDocument();
  });

  it("loads an example chip with one click", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<CryptoCard />);
    await screen.findByText("93,500.25");
    await userEvent.click(screen.getByRole("button", { name: "ETH" }));
    expect(await screen.findByText("3,200.10")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/crypto/eth-ethereum?currency=USD");
    expect(screen.getByLabelText("Cryptocurrency")).toHaveValue("ETH");
    expect(screen.getByText("+2.50% 24h")).toBeInTheDocument();
  });

  it("shows the top coins by market cap when the picker is opened", async () => {
    const fetchMock = stubFetch({
      ...routes,
      "/api/crypto?limit=8": assets(["btc-bitcoin", "Bitcoin", "BTC", 1], ["eth-ethereum", "Ethereum", "ETH", 2]),
    });
    renderWithClient(<CryptoCard />);
    await screen.findByText("93,500.25");
    await userEvent.click(screen.getByRole("button", { name: "Show cryptocurrencies" }));
    expect(await screen.findByRole("option", { name: /Ethereum.*ETH/ })).toBeInTheDocument();
    expect(screen.getByText("Top by market cap")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/crypto?limit=8");
  });

  it("searches by name and selects a suggestion", async () => {
    const fetchMock = stubFetch({
      ...routes,
      "/api/crypto?limit=8": assets(["btc-bitcoin", "Bitcoin", "BTC", 1]),
      "/api/crypto?q=shib&limit=8": assets(["shib-shiba-inu", "Shiba Inu", "SHIB", 20]),
    });
    renderWithClient(<CryptoCard />);
    await screen.findByText("93,500.25");
    const input = screen.getByLabelText("Cryptocurrency");
    await userEvent.clear(input);
    await userEvent.type(input, "shib");

    await userEvent.click(await screen.findByRole("option", { name: /Shiba Inu.*SHIB/ }));

    expect(fetchMock).toHaveBeenCalledWith("/api/crypto?q=shib&limit=8");
    expect(await screen.findByText("0.00001250")).toBeInTheDocument();
    expect(input).toHaveValue("Shiba Inu");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects the first suggestion with Enter", async () => {
    const fetchMock = stubFetch({
      ...routes,
      "/api/crypto?limit=8": assets(["btc-bitcoin", "Bitcoin", "BTC", 1]),
      "/api/crypto?q=eth&limit=8": assets(["eth-ethereum", "Ethereum", "ETH", 2]),
    });
    renderWithClient(<CryptoCard />);
    await screen.findByText("93,500.25");
    const input = screen.getByLabelText("Cryptocurrency");
    await userEvent.clear(input);
    await userEvent.type(input, "eth");
    await screen.findByRole("option", { name: /Ethereum/ });
    await userEvent.type(input, "{enter}");
    expect(await screen.findByText("3,200.10")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/crypto/eth-ethereum?currency=USD");
  });

  it("says when nothing matches the search", async () => {
    stubFetch({
      ...routes,
      "/api/crypto?limit=8": assets(["btc-bitcoin", "Bitcoin", "BTC", 1]),
      "/api/crypto?q=zzzz&limit=8": assets(),
    });
    renderWithClient(<CryptoCard />);
    await screen.findByText("93,500.25");
    const input = screen.getByLabelText("Cryptocurrency");
    await userEvent.clear(input);
    await userEvent.type(input, "zzzz");
    expect(await screen.findByText("No cryptocurrencies found.")).toBeInTheDocument();
  });

  it("hides the optional fields when the API does not send them", async () => {
    stubFetch({ ...routes, "/api/crypto?limit=8": assets(["shib-shiba-inu", "Shiba Inu", "SHIB", null]) });
    renderWithClient(<CryptoCard />);
    await screen.findByText("93,500.25");
    await userEvent.click(screen.getByRole("button", { name: "Show cryptocurrencies" }));
    await userEvent.click(await screen.findByRole("option", { name: /Shiba Inu/ }));
    expect(await screen.findByText("0.00001250")).toBeInTheDocument();
    expect(screen.getByText("SHIB")).toBeInTheDocument(); // no rank suffix
    expect(screen.queryByText(/24h/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vol\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mkt cap/)).not.toBeInTheDocument();
  });

  it("shows a friendly message when the coin has no quote", async () => {
    stubFetch({});
    renderWithClient(<CryptoCard />);
    expect(await screen.findByRole("alert")).toHaveTextContent("This cryptocurrency has no quote available.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the error with retry when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 502, statusText: "Bad Gateway" })));
    renderWithClient(<CryptoCard />);
    expect(await screen.findByRole("alert")).toHaveTextContent("502 Bad Gateway");
  });
});
