import { beforeEach, describe, expect, it } from "vitest";
import { clearSharedCacheForTests } from "@/lib/cache/shared-cache";
import { getTomTomIncidents, mapTomTomIncident } from "@/lib/api-clients/tomtom";

beforeEach(() => clearSharedCacheForTests());

const crash = {
  geometry: { type: "Point", coordinates: [22.5, 43.1] },
  properties: {
    id: "x1",
    iconCategory: 1,
    magnitudeOfDelay: 3,
    events: [{ description: "Accident" }, { description: "Queuing traffic" }],
    from: "Niš",
    to: "Pirot",
    delay: 600,
    roadNumbers: ["E80"],
    startTime: "2026-11-17T10:00:00Z",
  },
};

describe("mapTomTomIncident", () => {
  it("maps an incident from the v5 response", () => {
    expect(mapTomTomIncident(crash)).toMatchObject({
      id: "tomtom-x1",
      type: "accident",
      severity: "major",
      delayMin: 10,
      coords: { lng: 22.5, lat: 43.1 },
      title: "Accident. Queuing traffic",
    });
  });
  it("takes the first point of a line and drops slow patches and unplaceable rows", () => {
    expect(
      mapTomTomIncident({
        ...crash,
        geometry: { type: "LineString", coordinates: [[23, 44], [23.1, 44.1]] },
      })?.coords
    ).toEqual({ lng: 23, lat: 44 });
    expect(
      mapTomTomIncident({
        ...crash,
        properties: { ...crash.properties, iconCategory: 6, magnitudeOfDelay: 1 },
      })
    ).toBeNull();
    expect(mapTomTomIncident({ properties: crash.properties })).toBeNull();
    expect(
      mapTomTomIncident({ ...crash, properties: { ...crash.properties, iconCategory: 8, magnitudeOfDelay: 4 } })
        ?.type
    ).toBe("road_closure");
  });
});

describe("getTomTomIncidents", () => {
  it("is empty without a key", async () => {
    expect(await getTomTomIncidents({ w: 22, s: 41, e: 23, n: 42 }, { key: null })).toEqual([]);
  });

  it("asks v5 once per tile, then serves memory", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ incidents: [crash] }), { status: 200 });
    }) as unknown as typeof fetch;
    const bbox = { w: 22.2, s: 41.2, e: 22.8, n: 41.8 };
    expect(await getTomTomIncidents(bbox, { key: "secret", fetchImpl })).toHaveLength(1);
    expect(await getTomTomIncidents(bbox, { key: "secret", fetchImpl })).toHaveLength(1);
    expect(urls).toHaveLength(1);
    const url = new URL(urls[0]!);
    expect(url.origin + url.pathname).toBe(
      "https://api.tomtom.com/traffic/services/5/incidentDetails"
    );
    expect(url.searchParams.get("bbox")).toBe("22,41,23,42");
    expect(url.searchParams.get("fields")).toContain("magnitudeOfDelay");
    expect(url.searchParams.get("key")).toBe("secret");
  });

  it("reports a refusal without the key", async () => {
    const errors: string[] = [];
    const denied = (async () =>
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })) as unknown as typeof fetch;
    expect(
      await getTomTomIncidents(
        { w: 22.2, s: 41.2, e: 22.8, n: 41.8 },
        { key: "secret", fetchImpl: denied, onError: (message) => errors.push(message) }
      )
    ).toEqual([]);
    expect(errors).toEqual(["403 Forbidden"]);
  });
});
