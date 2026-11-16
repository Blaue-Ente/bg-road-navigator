import { describe, expect, it, vi } from "vitest";
import { fetchFueloAverage, parseFueloAverage } from "@/lib/fuel-prices/fuelo";
import { refreshFueloAverages, FUELO_MIN_GAP_MS } from "@/lib/fuel-prices/fuelo-refresh";
import { clearFueloCacheForTests, readFueloAverage } from "@/lib/fuel-prices/fuelo-cache";

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

  it("serializes cron calls at least 13s apart", async () => {
    clearFueloCacheForTests();
    const fetchImpl = vi.fn(
      async () =>
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
    await refreshFueloAverages({
      apiKey: "fk_test",
      fetchImpl,
      countries: ["bg", "de"],
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      now: new Date("2026-11-16T08:00:00.000Z"),
    });
    expect(sleeps.length).toBeGreaterThan(0);
    expect(sleeps.every((ms) => ms >= FUELO_MIN_GAP_MS)).toBe(true);
    expect(readFueloAverage("BG", "diesel")).toMatchObject({ price: 1.8 });
  });
});