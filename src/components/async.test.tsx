import { useQuery } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/test/utils";
import { Async } from "./async";

function Probe({ fn }: { fn: () => Promise<string> }) {
  const query = useQuery({ queryKey: ["probe"], queryFn: fn });
  return (
    <Async query={query} skeleton={<div data-testid="skeleton" />}>
      {(value) => <p>value: {value}</p>}
    </Async>
  );
}

describe("Async", () => {
  it("shows the skeleton while loading", () => {
    renderWithClient(<Probe fn={() => new Promise(() => {})} />);
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("renders the children once data arrives", async () => {
    renderWithClient(<Probe fn={async () => "ok"} />);
    expect(await screen.findByText("value: ok")).toBeInTheDocument();
  });

  it("shows the error and recovers after retry", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce("recovered");
    renderWithClient(<Probe fn={fn} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("value: recovered")).toBeInTheDocument();
  });
});
