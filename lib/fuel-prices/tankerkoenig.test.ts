import { beforeEach, describe, expect, it } from "vitest";
import { clearSharedCacheForTests } from "@/lib/cache/shared-cache";
import { fetchTankerkoenigPrices } from "@/lib/fuel-prices/tankerkoenig";

const stations = [
  { name: "Near", brand: "A", lat: 52.52, lng: 13.4, diesel: 1.65, e5: 1.75 },
  { name: "Far", brand: "B", lat: 52.7, lng: 13.4, diesel: 1.5, e5: 1.6 },
];

describe("fetchTankerkoenigPrices", () => {
  beforeEach(() => clearSharedCacheForTests());

  it("shares one call between nearby drivers, keeps the real observation time and the 8 km limit", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ ok: true, stations }), { status: 200 });
    }) as unknown as typeof fetch;
    const first = await fetchTankerkoenigPrices(
      { fuel: "diesel", lat: 52.521, lng: 13.401 },
      { fetchImpl, now: new Date("2026-11-17T10:00:00Z"), apiKey: "k" }
    );
    const second = await fetchTankerkoenigPrices(
      { fuel: "diesel", lat: 52.52, lng: 13.4 },
      { fetchImpl, now: new Date("2026-11-17T10:05:00Z"), apiKey: "k" }
    );
    expect(urls).toHaveLength(1);
    expect(first.map((p) => p.stationName)).toEqual(["Near"]);
    expect(second[0]!.observedAt).toBe("2026-11-17T10:00:00.000Z");
    expect(new URL(urls[0]!).searchParams.get("rad")).toBe("12");
  });

  it("keeps petrol and diesel apart and never keeps a failure", async () => {
    let calls = 0;
    const flaky = (async () => {
      calls += 1;
      return calls === 1
        ? new Response("x", { status: 500 })
        : new Response(JSON.stringify({ ok: true, stations }), { status: 200 });
    }) as unknown as typeof fetch;
    const deps = { fetchImpl: flaky, now: new Date(), apiKey: "k" };
    expect(await fetchTankerkoenigPrices({ fuel: "diesel", lat: 52.52, lng: 13.4 }, deps)).toEqual([]);
    expect((await fetchTankerkoenigPrices({ fuel: "diesel", lat: 52.52, lng: 13.4 }, deps)).length).toBe(1);
    const petrol = await fetchTankerkoenigPrices({ fuel: "petrol", lat: 52.52, lng: 13.4 }, deps);
    expect(petrol[0]!.amount).toBe(1.75);
    expect(calls).toBe(3);
  });

  it("returns nothing for LPG without calling", async () => {
    let called = false;
    const fetchImpl = (async () => {
      called = true;
      return new Response("{}");
    }) as unknown as typeof fetch;
    expect(
      await fetchTankerkoenigPrices({ fuel: "lpg", lat: 52, lng: 13 }, { fetchImpl, now: new Date(), apiKey: "k" })
    ).toEqual([]);
    expect(called).toBe(false);
  });
});
