import { screen } from "@testing-library/react";
import { renderWithClient, stubFetch } from "@/test/utils";
import { EuriborCurve } from "./euribor-curve";

const euribor = (tenor: string, rate: number) => ({
  data: { tenor, rate, unit: "Percent per annum", frequency: "Monthly average" },
  metadata: { source: "ECB", asOf: "2026-09-01" },
});

const routes = {
  "/api/euribor/1M": euribor("1M", 2.41),
  "/api/euribor/3M": euribor("3M", 2.63),
  "/api/euribor/6M": euribor("6M", 2.92),
  "/api/euribor/12M": euribor("12M", 3.25),
};

afterEach(() => vi.unstubAllGlobals());

describe("EuriborCurve", () => {
  it("plots every tenor with its rate", async () => {
    stubFetch(routes);
    renderWithClient(<EuriborCurve />);
    expect(await screen.findByLabelText("Curva Euribor por prazo")).toBeInTheDocument();
    for (const label of ["1M", "3M", "6M", "12M", "2,41%", "3,25%"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(/referente a/)).toBeInTheDocument();
  });

  it("shows an error when a tenor fails", async () => {
    const { "/api/euribor/6M": _omit, ...partial } = routes;
    stubFetch(partial);
    renderWithClient(<EuriborCurve />);
    expect(await screen.findByRole("alert")).toHaveTextContent("404 Not Found");
  });
});
