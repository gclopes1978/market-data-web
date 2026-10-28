import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient, stubFetch } from "@/test/utils";
import { FxCard } from "./fx-card";

const routes = {
  "/api/fx/EUR/USD": { base: "EUR", quote: "USD", rate: 1.1188, date: "2026-10-26", source: "Frankfurter" },
  "/api/fx/USD/EUR": { base: "USD", quote: "EUR", rate: 0.89381, date: "2026-10-26", source: "Frankfurter" },
};

afterEach(() => vi.unstubAllGlobals());

describe("FxCard", () => {
  it("shows the rate and its inverse", async () => {
    stubFetch(routes);
    renderWithClient(<FxCard />);
    expect(await screen.findByText("1.1188")).toBeInTheDocument();
    expect(screen.getByText(/1 USD = 0.8938 EUR/)).toBeInTheDocument();
  });

  it("swaps the pair and fetches the reverse rate", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<FxCard />);
    await screen.findByText("1.1188");
    await userEvent.click(screen.getByRole("button", { name: "Swap pair" }));
    expect(await screen.findByText("0.8938")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/fx/USD/EUR");
  });

  it("does not call the API when both currencies are equal", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<FxCard />);
    await screen.findByText("1.1188");
    fetchMock.mockClear();
    await userEvent.selectOptions(screen.getByLabelText("Quote currency"), "EUR");
    expect(screen.getByText("Choose two different currencies.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("FxCard currency coverage", () => {
  it("lists every world currency with its English name", () => {
    stubFetch(routes);
    renderWithClient(<FxCard />);
    expect(screen.getAllByRole("option", { name: "JPY · Japanese Yen" })).toHaveLength(2); // one per select
    expect(screen.getAllByRole("option").length).toBeGreaterThan(300); // two selects x 150+ currencies
  });

  it("explains when the provider has no rate for a pair", async () => {
    stubFetch(routes); // any pair other than EUR/USD and USD/EUR answers 404
    renderWithClient(<FxCard />);
    await screen.findByText("1.1188");
    await userEvent.selectOptions(screen.getByLabelText("Quote currency"), "ZWG");
    expect(await screen.findByRole("alert")).toHaveTextContent("no rate for this currency pair");
  });
});
