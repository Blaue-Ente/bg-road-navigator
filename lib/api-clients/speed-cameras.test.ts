import { beforeEach, describe, expect, it } from "vitest";
import { clearSharedCacheForTests } from "@/lib/cache/shared-cache";
import {
  camerasFromPoints,
  loadSpeedCameras,
  parseMaxspeed,
  parseSpeedCameras,
  tilesForBbox,
} from "@/lib/api-clients/speed-cameras";

beforeEach(() => clearSharedCacheForTests());

describe("parseMaxspeed", () => {
  it("reads plain and unit forms", () => {
    expect(parseMaxspeed("50")).toBe(50);
    expect(parseMaxspeed("90 km/h")).toBe(90);
  });
  it("ignores text and out-of-range values", () => {
    expect(parseMaxspeed("signals")).toBeNull();
    expect(parseMaxspeed("5")).toBeNull();
    expect(parseMaxspeed(undefined)).toBeNull();
  });
});

describe("parseSpeedCameras", () => {
  it("keeps cameras and drops France and Switzerland", () => {
    const cameras = parseSpeedCameras({
      elements: [
        { type: "node", id: 1, lat: 42.7, lon: 23.3, tags: { maxspeed: "50" } },
        { type: "node", id: 2, lat: 48.85, lon: 2.35, tags: {} },
        { type: "node", id: 3, lat: 47.37, lon: 8.54, tags: {} },
        { type: "node", id: 4, lat: 52.52, lon: 13.4, tags: {} },
        { type: "way", id: 5, lat: 42.7, lon: 23.3 },
      ],
    });
    expect(cameras.map((camera) => camera.id)).toEqual([
      "osm-cam-1",
      "osm-cam-4",
    ]);
    expect(cameras[0]?.maxspeed).toBe(50);
  });
  it("returns nothing for a broken payload", () => {
    expect(parseSpeedCameras(null)).toEqual([]);
    expect(parseSpeedCameras({ elements: "x" })).toEqual([]);
  });
});

describe("tilesForBbox", () => {
  it("snaps to half-degree tiles", () => {
    const tiles = tilesForBbox({ w: 23.1, s: 42.6, e: 23.7, n: 42.9 });
    expect(tiles).toEqual([
      { w: 23, s: 42.5, e: 23.5, n: 43 },
      { w: 23.5, s: 42.5, e: 24, n: 43 },
    ]);
  });
});

describe("loadSpeedCameras", () => {
  it("merges tiles and reports failure only when all fail", async () => {
    const ok = (async () =>
      new Response(
        JSON.stringify({
          elements: [{ type: "node", id: 9, lat: 42.7, lon: 23.3, tags: {} }],
        }),
        { status: 200 }
      )) as unknown as typeof fetch;
    const result = await loadSpeedCameras(
      { w: 23.1, s: 42.6, e: 23.4, n: 42.9 },
      ok,
      []
    );
    expect(result.ok).toBe(true);
    expect(result.cameras).toHaveLength(1);

    const down = (async () =>
      new Response("busy", { status: 504 })) as unknown as typeof fetch;
    // A different area: the first one is now kept, so it would not ask again.
    const failed = await loadSpeedCameras(
      { w: 25.1, s: 42.6, e: 25.4, n: 42.9 },
      down,
      []
    );
    expect(failed).toEqual({ cameras: [], ok: false });
    const again = await loadSpeedCameras({ w: 23.1, s: 42.6, e: 23.4, n: 42.9 }, down, []);
    expect(again.ok).toBe(true);
  });
});

describe("loadSpeedCameras mirrors and cache", () => {
  it("takes the first mirror that answers and keeps the tile for the next view", async () => {
    let calls = 0;
    const fetchImpl = (async (url: string) => {
      calls += 1;
      if (url.includes("overpass-api.de")) throw new Error("refused");
      return new Response(
        JSON.stringify({ elements: [{ type: "node", id: 1, lat: 52.52, lon: 13.4, tags: { maxspeed: "50" } }] }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;
    const bbox = { w: 13.4, s: 52.5, e: 13.45, n: 52.55 };
    const first = await loadSpeedCameras(bbox, fetchImpl, []);
    expect(first.ok).toBe(true);
    expect(first.cameras).toHaveLength(1);
    const before = calls;
    await loadSpeedCameras(bbox, fetchImpl, []);
    expect(calls).toBe(before);
  });

  it("says so when every mirror fails and does not keep the failure", async () => {
    const down = (async () => new Response("x", { status: 504 })) as unknown as typeof fetch;
    const bbox = { w: 13.4, s: 52.5, e: 13.45, n: 52.55 };
    expect(await loadSpeedCameras(bbox, down, [])).toEqual({ cameras: [], ok: false });
    const up = (async () =>
      new Response(JSON.stringify({ elements: [] }), { status: 200 })) as unknown as typeof fetch;
    expect((await loadSpeedCameras(bbox, up, [])).ok).toBe(true);
  });
});

describe("built dataset", () => {
  const points: Array<[number, number, number]> = [
    [23.3, 42.7, 50],
    [23.31, 42.71, 0],
    [2.35, 48.85, 50], // Paris: France, never shown
    [8.54, 47.37, 50], // Zurich: Switzerland, never shown
    [30.0, 45.0, 60], // far away
  ];

  it("answers from the points inside the box, without any outside call", async () => {
    const never = (async () => {
      throw new Error("no network expected");
    }) as unknown as typeof fetch;
    const result = await loadSpeedCameras({ w: 23.0, s: 42.5, e: 23.5, n: 43.0 }, never, points);
    expect(result.ok).toBe(true);
    expect(result.cameras.map((c) => c.maxspeed)).toEqual([50, null]);
  });

  it("never returns cameras in France or Switzerland", () => {
    expect(camerasFromPoints({ w: 1, s: 46, e: 9, n: 49 }, points)).toEqual([]);
  });
});

describe("wide views", () => {
  it("thins an overfull view evenly instead of cutting it off", () => {
    const many: Array<[number, number, number]> = Array.from({ length: 9_000 }, (_, index) => [
      20 + (index % 3_000) * 0.001,
      44 + Math.floor(index / 3_000) * 0.1,
      50,
    ]);
    const cameras = camerasFromPoints({ w: 19, s: 43, e: 24, n: 45 }, many);
    expect(cameras.length).toBeLessThanOrEqual(3_000);
    expect(cameras.length).toBeGreaterThan(2_000);
    const lngs = cameras.map((camera) => camera.lng);
    // Both ends of the view are still represented.
    expect(Math.min(...lngs)).toBeLessThan(20.1);
    expect(Math.max(...lngs)).toBeGreaterThan(22.8);
  });
});
