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
    expect(await screen.findByText("1,1188")).toBeInTheDocument();
    expect(screen.getByText(/1 USD = 0,8938 EUR/)).toBeInTheDocument();
  });

  it("swaps the pair and fetches the reverse rate", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<FxCard />);
    await screen.findByText("1,1188");
    await userEvent.click(screen.getByRole("button", { name: "Inverter par" }));
    expect(await screen.findByText("0,8938")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/fx/USD/EUR");
  });

  it("does not call the API when both currencies are equal", async () => {
    const fetchMock = stubFetch(routes);
    renderWithClient(<FxCard />);
    await screen.findByText("1,1188");
    fetchMock.mockClear();
    await userEvent.selectOptions(screen.getByLabelText("Moeda cotada"), "EUR");
    expect(screen.getByText("Escolha duas moedas diferentes.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
