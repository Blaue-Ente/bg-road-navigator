import { afterEach, describe, expect, it, vi } from "vitest";
import { clearOsmMemoryCacheForTests } from "@/lib/nakordoni/cache-store";
import { fetchPoiCorridor, fetchPoiHealth, parsePoiCollection } from "@/lib/poi/client";
import { loadCorridorPlaces } from "@/lib/poi/load-corridor";

const LINE: Array<[number, number]> = [
  [23.32, 42.7],
  [23.8, 42.5],
  [24.75, 42.15],
];

afterEach(() => {
  clearOsmMemoryCacheForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POI service", () => {
  it("parses a corridor item and keeps along_m", () => {
    const parsed = parsePoiCollection({
      source: "poi",
      osm_timestamp: "2026-11-01T00:00:00Z",
      items: [
        {
          id: "node/1",
          type: "fuel",
          name: "OMV Хемус",
          brand: "OMV",
          operator: "OMV",
          lat: 42.7,
          lon: 23.4,
          tags: { brand: "OMV" },
          dist_m: 120,
          along_m: 4000,
        },
      ],
    });
    expect(parsed?.items[0]).toMatchObject({
      id: "node/1",
      name: "OMV Хемус",
      along_m: 4000,
    });
  });

  it("posts one corridor query with the API key and caches the second plan", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
    vi.stubEnv("OCI_GEO_API_KEY", "poi-secret-key");
    vi.stubEnv("POI_OVERPASS_FALLBACK", "");
    const seen: string[] = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        seen.push(url);
        expect(new Headers(init?.headers).get("X-API-Key")).toBe(
          "poi-secret-key"
        );
        expect(url).not.toContain("poi-secret-key");
        const body = JSON.parse(String(init?.body)) as {
          polyline: Array<[number, number]>;
          types: string[];
        };
        expect(body.polyline[0]).toEqual([42.7, 23.32]);
        expect(body.types).toEqual(
          expect.arrayContaining(["fuel", "hotel", "restaurant", "rest_area"])
        );
        return Response.json({
          source: "poi",
          osm_timestamp: "2026-11-01T00:00:00Z",
          items: [
            {
              id: "node/9",
              type: "fuel",
              name: "Петрол София",
              brand: "Петрол",
              operator: null,
              lat: 42.69,
              lon: 23.33,
              tags: {},
              dist_m: 40,
              along_m: 1000,
            },
          ],
        });
      }
    );

    const first = await loadCorridorPlaces({ line: LINE });
    const second = await loadCorridorPlaces({ line: LINE });
    expect(first.places[0]?.name).toBe("Петрол София");
    expect(first.source).toBe("poi");
    expect(second.places).toHaveLength(1);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe("https://geo.example/poi/corridor");
  });

  it("does not call Overpass unless the fallback flag is on", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
    vi.stubEnv("OCI_GEO_API_KEY", "poi-secret-key");
    vi.stubEnv("POI_OVERPASS_FALLBACK", "");
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return new Response("no", { status: 503 });
    });
    const missed = await loadCorridorPlaces({ line: LINE });
    expect(missed.ok).toBe(false);
    expect(seen.some((url) => url.includes("overpass"))).toBe(false);

    clearOsmMemoryCacheForTests();
    vi.stubEnv("POI_OVERPASS_FALLBACK", "true");
    const fallback = await loadCorridorPlaces({ line: LINE });
    expect(fallback.source).toBe("overpass");
    expect(seen.some((url) => url.includes("overpass-api.de"))).toBe(true);
  });

  it("checks health and retries a corridor that rejects extra types", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
    vi.stubEnv("OCI_GEO_API_KEY", "poi-secret-key");
    const bodies: string[] = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/health")) return Response.json({ ok: true });
        bodies.push(String(init?.body));
        const types = (JSON.parse(String(init?.body)) as { types: string[] })
          .types;
        if (types.includes("attraction")) {
          return new Response("bad types", { status: 400 });
        }
        return Response.json({ items: [], source: "poi", osm_timestamp: null });
      }
    );
    const health = await fetchPoiHealth({
      baseUrl: "https://geo.example/poi",
      apiKey: "poi-secret-key",
    });
    expect(health).toBe("ok");
    const corridor = await fetchPoiCorridor(
      { baseUrl: "https://geo.example/poi", apiKey: "poi-secret-key" },
      {
        polyline: [
          [42.7, 23.3],
          [42.2, 24.7],
        ],
        bufferM: 1000,
        types: ["fuel", "attraction"],
        limit: 10,
      }
    );
    expect(corridor?.items).toEqual([]);
    expect(bodies).toHaveLength(2);
  });
});
