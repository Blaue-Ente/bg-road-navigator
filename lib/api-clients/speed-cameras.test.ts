import { beforeEach, describe, expect, it } from "vitest";
import { clearSharedCacheForTests } from "@/lib/cache/shared-cache";
import {
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
      ok
    );
    expect(result.ok).toBe(true);
    expect(result.cameras).toHaveLength(1);

    const down = (async () =>
      new Response("busy", { status: 504 })) as unknown as typeof fetch;
    const failed = await loadSpeedCameras(
      { w: 23.1, s: 42.6, e: 23.4, n: 42.9 },
      down
    );
    expect(failed).toEqual({ cameras: [], ok: false });
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
    const first = await loadSpeedCameras(bbox, fetchImpl);
    expect(first.ok).toBe(true);
    expect(first.cameras).toHaveLength(1);
    const before = calls;
    await loadSpeedCameras(bbox, fetchImpl);
    expect(calls).toBe(before);
  });

  it("says so when every mirror fails and does not keep the failure", async () => {
    const down = (async () => new Response("x", { status: 504 })) as unknown as typeof fetch;
    const bbox = { w: 13.4, s: 52.5, e: 13.45, n: 52.55 };
    expect(await loadSpeedCameras(bbox, down)).toEqual({ cameras: [], ok: false });
    const up = (async () =>
      new Response(JSON.stringify({ elements: [] }), { status: 200 })) as unknown as typeof fetch;
    expect((await loadSpeedCameras(bbox, up)).ok).toBe(true);
  });
});
