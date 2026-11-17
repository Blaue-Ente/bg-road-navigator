import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSharedCacheForTests } from "@/lib/cache/shared-cache";
import { getEVStations } from "@/lib/api-clients/opencharge";

const station = (id: number, lat: number, lng: number) => ({
  ID: id,
  AddressInfo: { Title: `S${id}`, Latitude: lat, Longitude: lng, Distance: 99 },
  Connections: [{ PowerKW: 50, ConnectionType: { Title: "CCS" } }],
  StatusType: { IsOperational: true },
});

describe("getEVStations", () => {
  const calls: string[] = [];

  beforeEach(() => {
    clearSharedCacheForTests();
    calls.length = 0;
    vi.stubEnv("OPENCHARGE_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        return new Response(
          JSON.stringify([station(1, 43.3, 21.9), station(2, 43.31, 21.91), station(3, 44.5, 23)]),
          { status: 200 }
        );
      })
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("shares one call between nearby drivers and recomputes distances from the real point", async () => {
    const first = await getEVStations(21.9, 43.3, 10);
    const second = await getEVStations(21.91, 43.31, 10);
    expect(calls).toHaveLength(1);
    expect(first.map((s) => s.name)).toEqual(["S1", "S2"]);
    expect(first[0]!.distance_km).toBeLessThan(1);
    expect(first[0]!.distance_km).not.toBe(99);
    expect(second.map((s) => s.name)).toContain("S2");
    // The far station is outside the radius from either real point.
    expect(second.some((s) => s.name === "S3")).toBe(false);
  });

  it("does not keep a failed call", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 500 })));
    expect(await getEVStations(21.9, 43.3, 10)).toEqual([]);
    const ok = vi.fn(async () => new Response(JSON.stringify([station(1, 43.3, 21.9)]), { status: 200 }));
    vi.stubGlobal("fetch", ok);
    expect((await getEVStations(21.9, 43.3, 10)).length).toBe(1);
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("is empty without a key", async () => {
    vi.stubEnv("OPENCHARGE_API_KEY", "");
    expect(await getEVStations(21.9, 43.3, 10)).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});
