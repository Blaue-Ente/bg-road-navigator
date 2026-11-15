import { afterEach, describe, expect, it, vi } from "vitest";
import { clearOsmMemoryCacheForTests } from "@/lib/nakordoni/cache-store";
import { clearAveragesForTests } from "@/lib/fuel-prices/national-store";
import { runTripPlan } from "@/lib/planner/run-plan";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import { resolveVehicle } from "@/lib/planner/vehicle";

const SOFIA = { lng: 23.3219, lat: 42.6977 };
const PLOVDIV = { lng: 24.7453, lat: 42.1354 };

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
    expect(plan?.checklist.vignettes.some((item) => item.country_code === "BG")).toBe(
      true
    );
    expect(plan?.checklist.winter.length).toBeGreaterThan(0);
    expect(plan?.checklist.kit.length).toBeGreaterThan(0);
    expect(plan?.weather.segments).toHaveLength(4);
    expect(plan?.why_this_route.some((reason) => reason.code === "preference")).toBe(
      true
    );
    expect(plan?.warnings.some((warning) => warning.includes("OSRM"))).toBe(true);
    expect(seen.some((url) => url.includes("overpass"))).toBe(false);
    expect(seen.filter((url) => url.includes("/route/v1/driving/"))).toHaveLength(1);
  });
});
