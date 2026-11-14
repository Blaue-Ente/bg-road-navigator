import { afterEach, describe, expect, it, vi } from "vitest";
import { searchPlaces, reversePlace } from "@/lib/api-clients/geocoding";
import { clearPhotonCacheForTests } from "@/lib/api-clients/photon";

const KEY = "test-key-value";

afterEach(() => {
  clearPhotonCacheForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("searchPlaces", () => {
  it("uses Nominatim when OCI geo is unset", async () => {
    const seen: string[] = [];
    stubFetch((url) => {
      seen.push(url);
      return json([nominatimCity("Пловдив")]);
    });
    const places = await searchPlaces("Пловдив тест");
    expect(places[0]?.label).toBe("Пловдив");
    expect(seen.some((url) => url.includes("/photon/"))).toBe(false);
    expect(seen.some((url) => url.includes("/search?"))).toBe(true);
  });

  it("sends Photon bias and language, and does not call Nominatim", async () => {
    readyEnv();
    const seen: string[] = [];
    stubFetch((url, init) => {
      seen.push(url);
      expect(new Headers(init?.headers).get("X-API-Key")).toBe(KEY);
      expect(url).not.toContain(KEY);
      return json({
        features: [photonCity("София", "BG", [23.3219, 42.6977], "city")],
      });
    });
    const places = await searchPlaces("София център", {
      lat: 42.7,
      lon: 23.32,
      zoom: 8,
      lang: "bg",
    });
    expect(places[0]?.countryCode).toBe("BG");
    expect(seen).toHaveLength(1);
    const url = new URL(seen[0]!);
    expect(url.pathname).toBe("/photon/api");
    expect(url.searchParams.get("lat")).toBe("42.70000");
    expect(url.searchParams.get("lon")).toBe("23.32000");
    expect(url.searchParams.get("zoom")).toBe("8");
    expect(url.searchParams.get("lang")).toBe("bg");
    expect(url.searchParams.get("location_bias_scale")).toBeTruthy();
  });

  it("falls back to Nominatim on Photon 401, 500, and timeout", async () => {
    readyEnv();
    for (const status of [401, 500]) {
      clearPhotonCacheForTests();
      const seen: string[] = [];
      stubFetch((url) => {
        seen.push(url);
        if (url.includes("/photon/")) {
          return new Response("denied", { status });
        }
        return json([nominatimCity(`Град ${status}`)]);
      });
      const places = await searchPlaces(`град ${status} търсене`);
      expect(places[0]?.label).toBe(`Град ${status}`);
      expect(seen.some((url) => url.includes("nominatim"))).toBe(true);
    }

    clearPhotonCacheForTests();
    stubFetch((url) => {
      if (url.includes("/photon/")) {
        throw new DOMException("aborted", "AbortError");
      }
      return json([nominatimCity("Варна")]);
    });
    const places = await searchPlaces("Варна търсене");
    expect(places[0]?.label).toBe("Варна");
  });
});

describe("reversePlace", () => {
  it("uses Photon reverse and falls back to Nominatim", async () => {
    readyEnv();
    stubFetch((url) => {
      expect(url).toContain("/photon/reverse?");
      expect(url).toContain("lon=23.3219");
      return json({
        features: [photonCity("София", "BG", [23.3219, 42.6977], "city")],
      });
    });
    const hit = await reversePlace(42.6977, 23.3219, { lang: "bg" });
    expect(hit?.label).toBe("София");

    stubFetch((url) => {
      if (url.includes("/photon/")) return new Response("no", { status: 401 });
      return json({
        place_id: 3,
        osm_type: "node",
        osm_id: 3,
        display_name: "Пловдив, България",
        lat: "42.1354",
        lon: "24.7453",
        name: "Пловдив",
        address: { city: "Пловдив", country: "България", country_code: "bg" },
      });
    });
    const fallback = await reversePlace(42.1354, 24.7453);
    expect(fallback?.label).toBe("Пловдив");
    expect(fallback?.countryCode).toBe("BG");
  });
});

function readyEnv() {
  vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
  vi.stubEnv("OCI_GEO_API_KEY", KEY);
}

function stubFetch(
  handle: (url: string, init?: RequestInit) => Response | Promise<Response>
) {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return handle(url, init);
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function nominatimCity(name: string) {
  return {
    place_id: name.length,
    osm_type: "relation",
    osm_id: name.length,
    display_name: `${name}, България`,
    lat: "42.15",
    lon: "24.75",
    name,
    type: "city",
    address: { city: name, country: "България", country_code: "bg" },
  };
}

function photonCity(
  name: string,
  countrycode: string,
  coordinates: [number, number],
  osmValue: string
) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: {
      osm_type: "R",
      osm_id: 1,
      name,
      countrycode,
      osm_key: "place",
      osm_value: osmValue,
      country: countrycode,
    },
  };
}
