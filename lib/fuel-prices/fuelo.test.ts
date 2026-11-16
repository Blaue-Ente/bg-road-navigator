import { describe, expect, it, vi } from "vitest";
import { fetchFueloAverage, parseFueloAverage } from "@/lib/fuel-prices/fuelo";
import { refreshFueloAverages, FUELO_MIN_GAP_MS } from "@/lib/fuel-prices/fuelo-refresh";

describe("fuelo average", () => {
  it("parses a valid payload", () => {
    expect(
      parseFueloAverage({
        country: "bg",
        fuel: "diesel",
        date: "2026-10-16",
        price: 1.91,
        currency: "EUR",
        unit: "L",
      })
    ).toMatchObject({ country: "BG", price: 1.91 });
  });

  it("does not call the network without a key", async () => {
    const fetchImpl = vi.fn();
    const result = await fetchFueloAverage("bg", "diesel", {
      apiKey: "",
      fetchImpl,
    });
    expect(result.data).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("serializes cron calls at least 13s apart and warms data cache", async () => {
    const fetchImpl = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: {
              country: "bg",
              fuel: "diesel",
              date: "2026-11-16",
              price: 1.8,
              currency: "EUR",
              unit: "L",
            },
          }),
          { status: 200 }
        )
    );
    const sleeps: number[] = [];
    const report = await refreshFueloAverages({
      apiKey: "fk_test",
      fetchImpl,
      countries: ["bg", "de"],
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    expect(sleeps.length).toBeGreaterThan(0);
    expect(sleeps.every((ms) => ms >= FUELO_MIN_GAP_MS)).toBe(true);
    expect(report.stored).toBe(4);
    const call = fetchImpl.mock.calls[0];
    expect(call).toBeDefined();
    const init = call![1] as RequestInit & {
      next?: { revalidate: number };
    };
    expect(init.next?.revalidate).toBe(86_400);
  });
});