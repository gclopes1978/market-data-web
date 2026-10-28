import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

/** Renders a component inside a fresh QueryClient (no retries, so errors show immediately). */
export function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

/** Replaces global fetch with a stub that answers from a URL -> body map (404 for unknown URLs). */
export function stubFetch(routes: Record<string, unknown>) {
  const fn = vi.fn(async (url: string) =>
    url in routes ? Response.json(routes[url]) : new Response("", { status: 404, statusText: "Not Found" }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}
