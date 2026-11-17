import { beforeEach, describe, expect, it } from "vitest";
import { clearSharedCacheForTests } from "@/lib/cache/shared-cache";
import {
  getHereIncidents,
  hereKey,
  mapHereIncident,
  mergeIncidents,
} from "@/lib/api-clients/here-traffic";
import type { TrafficIncident } from "@/lib/api-clients/tomtom";

beforeEach(() => clearSharedCacheForTests());

const crash = {
  location: { shape: { links: [{ points: [{ lat: 43.1, lng: 22.5 }] }] } },
  incidentDetails: {
    id: "abc",
    type: "accident",
    criticality: "major",
    summary: { value: "Crash on E80" },
    description: { value: "Crash on E80 near Pirot" },
    startTime: "2026-11-17T10:00:00Z",
  },
};

describe("hereKey", () => {
  it("reads HERE_API_KEY and trims it", () => {
    const env = (value: Record<string, string>) => value as unknown as NodeJS.ProcessEnv;
    expect(hereKey(env({}))).toBeNull();
    expect(hereKey(env({ HERE_API_KEY: " k " }))).toBe("k");
  });
});

describe("mapHereIncident", () => {
  it("maps a serious incident to the app's shape", () => {
    expect(mapHereIncident(crash)).toMatchObject({
      id: "here-abc",
      type: "accident",
      severity: "major",
      title: "Crash on E80",
      coords: { lng: 22.5, lat: 43.1 },
    });
  });
  it("drops minor ones, unplaceable ones and marks closures", () => {
    expect(
      mapHereIncident({ ...crash, incidentDetails: { ...crash.incidentDetails, criticality: "low" } })
    ).toBeNull();
    expect(mapHereIncident({ incidentDetails: crash.incidentDetails })).toBeNull();
    expect(
      mapHereIncident({
        ...crash,
        incidentDetails: { ...crash.incidentDetails, type: "other", roadClosed: true },
      })?.type
    ).toBe("road_closure");
  });
});

describe("mergeIncidents", () => {
  const base: TrafficIncident = {
    id: "t1",
    type: "accident",
    title: "",
    description: "",
    coords: { lng: 22.5, lat: 43.1 },
    severity: "major",
    delayMin: 0,
    publishedAt: "",
    updatedAt: "",
  };
  it("keeps one of two near-identical reports and both of different ones", () => {
    const twin = { ...base, id: "here-1", coords: { lng: 22.5005, lat: 43.1 } };
    const other = { ...base, id: "here-2", type: "construction" as const };
    const far = { ...base, id: "here-3", coords: { lng: 23.5, lat: 43.1 } };
    expect(mergeIncidents([base], [twin, other, far]).map((i) => i.id)).toEqual([
      "t1",
      "here-2",
      "here-3",
    ]);
  });
});

describe("getHereIncidents", () => {
  it("is empty without a key", async () => {
    expect(await getHereIncidents({ w: 22, s: 41, e: 23, n: 42 }, { key: null })).toEqual([]);
  });

  it("asks once per tile with the key in the query, then serves memory", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ results: [crash] }), { status: 200 });
    }) as unknown as typeof fetch;
    const bbox = { w: 22.2, s: 41.2, e: 22.8, n: 41.8 };
    const first = await getHereIncidents(bbox, { key: "secret", fetchImpl });
    const second = await getHereIncidents(bbox, { key: "secret", fetchImpl });
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(urls).toHaveLength(1);
    const url = new URL(urls[0]!);
    expect(url.origin + url.pathname).toBe("https://data.traffic.hereapi.com/v7/incidents");
    expect(url.searchParams.get("in")).toBe("bbox:22,41,23,42");
    expect(url.searchParams.get("apiKey")).toBe("secret");
  });

  it("reports a refusal without the key and returns nothing", async () => {
    const errors: string[] = [];
    const denied = (async () =>
      new Response(JSON.stringify({ title: "Unauthorized", cause: "apiKey invalid" }), {
        status: 401,
      })) as unknown as typeof fetch;
    const result = await getHereIncidents(
      { w: 22.2, s: 41.2, e: 22.8, n: 41.8 },
      { key: "secret", fetchImpl: denied, onError: (message) => errors.push(message) }
    );
    expect(result).toEqual([]);
    expect(errors).toEqual(["401 apiKey invalid"]);
  });
});
