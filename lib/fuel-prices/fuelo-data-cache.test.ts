import { describe, expect, it, vi } from "vitest";

describe("fuelo data cache", () => {
  it("passes Next shared cache options on fetch (fresh module)", async () => {
    vi.resetModules();
    const fetchImpl = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: {
              country: "mk",
              fuel: "diesel",
              date: "2026-11-15",
              price: 1.42,
              currency: "EUR",
              unit: "L",
            },
          }),
          { status: 200 }
        )
    );
    const { fetchFueloAverageCached, FUELO_REVALIDATE_SEC, FUELO_CACHE_TAG } =
      await import("@/lib/fuel-prices/fuelo-data-cache");
    const row = await fetchFueloAverageCached("mk", "diesel", {
      apiKey: "fk_test",
      fetchImpl,
    });
    expect(row).toMatchObject({ country: "MK", price: 1.42 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const call = fetchImpl.mock.calls[0];
    expect(call).toBeDefined();
    const init = call![1] as RequestInit & {
      next?: { revalidate: number; tags: string[] };
    };
    expect(init.next).toEqual({
      revalidate: FUELO_REVALIDATE_SEC,
      tags: [FUELO_CACHE_TAG],
    });
  });

  it("readFueloAverageCached rejects countries outside the cron list", async () => {
    const fetchImpl = vi.fn();
    const { readFueloAverageCached } = await import(
      "@/lib/fuel-prices/fuelo-data-cache"
    );
    const row = await readFueloAverageCached("jp", "diesel", {
      apiKey: "fk_test",
      fetchImpl,
    });
    expect(row).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});