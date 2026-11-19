import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/hazards/datex", () => ({
  loadRoadHazards: async () => [],
}));
import { clearOsmMemoryCacheForTests } from "@/lib/nakordoni/cache-store";
import { clearAveragesForTests } from "@/lib/fuel-prices/national-store";
import { runTripPlan } from "@/lib/planner/run-plan";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import { resolveVehicle } from "@/lib/planner/vehicle";

const SOFIA = { lng: 23.3219, lat: 42.6977 };
const PLOVDIV = { lng: 24.7453, lat: 42.1354 };
const MUNICH = { lng: 11.582, lat: 48.1351 };
const BUCHAREST = { lng: 26.1025, lat: 44.4268 };
const BERLIN = { lng: 13.405, lat: 52.52 };
const COLOGNE = { lng: 6.96, lat: 50.94 };
const ISTANBUL = { lng: 28.9784, lat: 41.0082 };

afterEach(() => {
  clearOsmMemoryCacheForTests();
  clearAveragesForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("runTripPlan", () => {
  it("returns checklist, weather, preferences and OSM attribution from one route fetch", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "");
    vi.stubEnv("OCI_GEO_API_KEY", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("POI_OVERPASS_FALLBACK", "");
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      seen.push(url);
      if (url.includes("open-meteo.com")) {
        return Response.json({
          hourly: {
            time: ["2026-11-15T08:00"],
            temperature_2m: [8],
            weather_code: [1],
            wind_speed_10m: [12],
            precipitation: [0],
          },
        });
      }
      if (url.includes("meteoalarm.org")) {
        return Response.json({ warnings: [] });
      }
      if (url.includes("/route/v1/driving/")) {
        return Response.json({
          code: "Ok",
          routes: [
            {
              distance: 145_000,
              duration: 6_600,
              geometry: {
                type: "LineString",
                coordinates: [
                  [SOFIA.lng, SOFIA.lat],
                  [PLOVDIV.lng, PLOVDIV.lat],
                ],
              },
              legs: [{ steps: [] }],
            },
          ],
        });
      }
      return new Response("no", { status: 404 });
    });

    const plan = await runTripPlan({
      origin: { label: "София", coords: SOFIA, countryCode: "BG" },
      destination: { label: "Пловдив", coords: PLOVDIV, countryCode: "BG" },
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      vehicle: resolveVehicle({ fuel_type: "diesel" }),
      fromProfile: false,
      preferences: { ...DEFAULT_TRIP_PREFERENCES, avoid_motorways: true },
    });

    expect(plan).not.toBeNull();
    expect(plan?.attribution).toEqual({
      text: "© OpenStreetMap contributors",
      license: "ODbL",
      href: "https://www.openstreetmap.org/copyright",
    });
    expect(plan?.preferences.avoid_motorways).toBe(true);
    expect(
      plan?.checklist.vignettes.some((item) => item.country_code === "BG")
    ).toBe(true);
    expect(plan?.checklist.winter.length).toBeGreaterThan(0);
    expect(plan?.checklist.kit.length).toBeGreaterThan(0);
    expect(plan?.weather.segments).toHaveLength(4);
    expect(
      plan?.why_this_route.some((reason) => reason.code === "preference")
    ).toBe(true);
    expect(plan?.warnings.some((warning) => warning.includes("OSRM"))).toBe(
      true
    );
    expect(plan?.checklist.safety_closing).toBe(
      "Пазете себе си и другите на пътя."
    );

    const trPlan = await runTripPlan({
      origin: { label: "София", coords: SOFIA, countryCode: "BG" },
      destination: { label: "Пловдив", coords: PLOVDIV, countryCode: "BG" },
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      vehicle: resolveVehicle({ fuel_type: "diesel" }),
      fromProfile: false,
      preferences: { ...DEFAULT_TRIP_PREFERENCES, avoid_motorways: true },
      locale: "tr",
    });
    expect(
      trPlan?.why_this_route.some(
        (r) =>
          r.code === "preference" &&
          (r.title.includes("Otoyol") || r.detail.includes("Otoyol"))
      )
    ).toBe(true);
    expect(trPlan?.checklist.safety_closing).not.toBe(
      "Пазете себе си и другите на пътя."
    );
    expect(plan?.checklist.safety.some((item) => item.kind === "law")).toBe(
      true
    );
    expect(plan?.checklist.safety.some((item) => item.kind === "advice")).toBe(
      true
    );
    expect(plan?.road_hazards).toEqual([]);
    expect(seen.some((url) => url.includes("datasheet.api.bg"))).toBe(false);
    expect(seen.some((url) => url.includes("overpass"))).toBe(false);
    expect(seen.some((url) => url.includes("police.hu"))).toBe(false);
    expect(
      seen.filter((url) => url.includes("/route/v1/driving/"))
    ).toHaveLength(2);
  });

  it("plans München → București without a forced Bulgarian border", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    const drivingCalls: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("open-meteo.com")) {
        return Response.json({
          hourly: {
            time: ["2026-11-15T08:00"],
            temperature_2m: [8],
            weather_code: [1],
            wind_speed_10m: [12],
            precipitation: [0],
          },
        });
      }
      if (url.includes("meteoalarm.org")) {
        return Response.json({ warnings: [] });
      }
      if (url.includes("/route/v1/driving/")) {
        drivingCalls.push(url);
        return Response.json({
          code: "Ok",
          routes: [
            {
              distance: 1_450_000,
              duration: 14_400,
              geometry: {
                type: "LineString",
                coordinates: [
                  [MUNICH.lng, MUNICH.lat],
                  [16.37, 48.21],
                  [19.04, 47.5],
                  [20.75, 46.07],
                  [BUCHAREST.lng, BUCHAREST.lat],
                ],
              },
              legs: [{ steps: [] }],
            },
          ],
        });
      }
      return new Response("no", { status: 404 });
    });

    const plan = await runTripPlan({
      origin: { label: "München", coords: MUNICH, countryCode: "DE" },
      destination: {
        label: "București",
        coords: BUCHAREST,
        countryCode: "RO",
      },
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      vehicle: resolveVehicle({ fuel_type: "diesel" }),
      fromProfile: false,
      preferences: DEFAULT_TRIP_PREFERENCES,
      locale: "bg",
    });
    expect(plan).not.toBeNull();
    expect(plan?.border.chosen).toBeNull();
    expect(plan?.route_options?.primary.source).toBe("direct");
    expect(plan?.route_options?.primary.label).toBe("Директен път");
    expect(
      plan?.checklist.vignettes.some((item) => item.country_code === "HU")
    ).toBe(true);
    expect(
      plan?.checklist.vignettes.some((item) => item.country_code === "BG")
    ).toBe(false);
    expect(plan?.border.note).toContain("Шенген");
    expect(drivingCalls).toHaveLength(1);
    const blob = JSON.stringify(plan);
    expect(blob).not.toContain("Видин");
    expect(blob).not.toContain("Калотина");
  });

  it("labels a via point at Nădlac without naming Bulgaria", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("open-meteo.com")) {
        return Response.json({
          hourly: {
            time: ["2026-11-15T08:00"],
            temperature_2m: [8],
            weather_code: [1],
            wind_speed_10m: [12],
            precipitation: [0],
          },
        });
      }
      if (url.includes("meteoalarm.org")) {
        return Response.json({ warnings: [] });
      }
      if (url.includes("/route/v1/driving/")) {
        return Response.json({
          code: "Ok",
          routes: [
            {
              distance: 1_450_000,
              duration: 14_400,
              geometry: {
                type: "LineString",
                coordinates: [
                  [MUNICH.lng, MUNICH.lat],
                  [20.75, 46.07],
                  [BUCHAREST.lng, BUCHAREST.lat],
                ],
              },
              legs: [{ steps: [] }],
            },
          ],
        });
      }
      return new Response("no", { status: 404 });
    });

    const plan = await runTripPlan({
      origin: { label: "München", coords: MUNICH, countryCode: "DE" },
      destination: {
        label: "București",
        coords: BUCHAREST,
        countryCode: "RO",
      },
      via: [{ label: "Nădlac", coords: { lng: 20.752, lat: 46.068 } }],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      vehicle: resolveVehicle({ fuel_type: "diesel" }),
      fromProfile: false,
      preferences: DEFAULT_TRIP_PREFERENCES,
      locale: "ro",
    });
    expect(plan?.route_options?.primary.label).toBe("Prin Nădlac");
    const blob = JSON.stringify(plan);
    expect(blob).not.toMatch(/Vidin|Kalotina|Калотина|Видин/i);
  });

  it("does not drive to Horgoš for Berlin → Vidin when the driver chose Arad", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("open-meteo.com")) {
        return Response.json({
          hourly: {
            time: ["2026-12-19T08:00"],
            temperature_2m: [1],
            weather_code: [1],
            wind_speed_10m: [12],
            precipitation: [0],
          },
        });
      }
      if (url.includes("meteoalarm.org")) return Response.json({ warnings: [] });
      if (url.includes("/route/v1/driving/")) {
        requests.push(decodeURIComponent(url));
        return Response.json({
          code: "Ok",
          routes: [
            {
              distance: 1_487_000,
              duration: 61_920,
              geometry: {
                type: "LineString",
                coordinates: [
                  [13.544, 52.528],
                  [19.0, 47.5],
                  [21.31, 46.19],
                  [22.875, 43.989],
                ],
              },
              legs: [{ steps: [] }],
            },
          ],
        });
      }
      return new Response("no", { status: 404 });
    });

    const plan = await runTripPlan({
      origin: { label: "Berlin", coords: { lng: 13.544, lat: 52.528 }, countryCode: "DE" },
      destination: { label: "Vidin", coords: { lng: 22.8744, lat: 43.99 }, countryCode: "BG" },
      via: [{ label: "Arad", coords: { lng: 21.3123, lat: 46.1866 } }],
      departAt: new Date("2026-12-19T03:00:00.000Z"),
      vehicle: resolveVehicle({ fuel_type: "diesel" }),
      fromProfile: false,
      preferences: DEFAULT_TRIP_PREFERENCES,
      locale: "bg",
    });
    expect(plan).not.toBeNull();
    // No route request goes through the Horgoš post (19.978, 46.183).
    expect(requests.some((url) => url.includes("19.978"))).toBe(false);
    expect(plan?.border.chosen?.border_id).not.toBe("horgos");
    expect(plan?.border.alternatives.some((b) => b.border_id === "horgos")).toBe(false);
  });

  it("still compares Bulgarian borders for Berlin → Sofia", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    const drivingCalls: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("open-meteo.com")) {
        return Response.json({
          hourly: {
            time: ["2026-11-15T08:00"],
            temperature_2m: [8],
            weather_code: [1],
            wind_speed_10m: [12],
            precipitation: [0],
          },
        });
      }
      if (url.includes("meteoalarm.org")) {
        return Response.json({ warnings: [] });
      }
      if (url.includes("/route/v1/driving/")) {
        drivingCalls.push(url);
        return Response.json({
          code: "Ok",
          routes: [
            {
              distance: 1_700_000,
              duration: 16_200,
              geometry: {
                type: "LineString",
                coordinates: [
                  [BERLIN.lng, BERLIN.lat],
                  [SOFIA.lng, SOFIA.lat],
                ],
              },
              legs: [{ steps: [] }],
            },
          ],
        });
      }
      return new Response("no", { status: 404 });
    });

    const plan = await runTripPlan({
      origin: { label: "Berlin", coords: BERLIN, countryCode: "DE" },
      destination: { label: "Sofia", coords: SOFIA, countryCode: "BG" },
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      vehicle: resolveVehicle({ fuel_type: "diesel" }),
      fromProfile: false,
      preferences: DEFAULT_TRIP_PREFERENCES,
    });
    expect(drivingCalls.length).toBeGreaterThan(1);
    expect(
      plan?.border.alternatives.some((row) => row.border_id === "kalotina") ||
        plan?.border.chosen?.border_id === "kalotina"
    ).toBe(true);
  });
});
