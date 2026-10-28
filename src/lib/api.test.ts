import { api, ApiError } from "./api";

const fetchMock = () => fetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({})));
});
afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("builds the URL of every endpoint", async () => {
    await api.fx("EUR", "USD");
    await api.euribor("3M");
    await api.bond("US", "US5Y");
    await api.commodity("GOLD");
    expect(fetchMock().mock.calls.map((c) => c[0])).toEqual([
      "/api/fx/EUR/USD",
      "/api/euribor/3M",
      "/api/bonds/US/US5Y",
      "/api/commodities/GOLD",
    ]);
  });

  it("URL-encodes stock symbols", async () => {
    await api.stock("^GSPC");
    expect(fetch).toHaveBeenCalledWith("/api/stocks/%5EGSPC");
  });

  it("returns the parsed JSON body", async () => {
    fetchMock().mockResolvedValueOnce(Response.json({ base: "EUR", quote: "USD", rate: 1.1 }));
    await expect(api.fx("EUR", "USD")).resolves.toMatchObject({ rate: 1.1 });
  });

  it("throws an ApiError carrying the HTTP status", async () => {
    fetchMock().mockResolvedValueOnce(new Response("", { status: 404, statusText: "Not Found" }));
    const error = await api.fx("EUR", "XXX").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: "404 Not Found" });
  });

  it("reads /health as plain text", async () => {
    fetchMock().mockResolvedValueOnce(new Response("Healthy"));
    await expect(api.health()).resolves.toBe("Healthy");
  });
});
