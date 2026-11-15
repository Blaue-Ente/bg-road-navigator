import { describe, expect, it } from "vitest";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import type { ScoredBorder } from "@/lib/planner/borders";
import type { WaitEstimate } from "@/lib/planner/types";
import {
  buildRouteOptions,
  divergentSampleKm,
  isMeaningfulDivergence,
} from "@/lib/planner/route-options";

const wait: WaitEstimate = {
  source: "local_typical",
  estimate: true,
  minutes: 30,
  metric: "wait_min",
  quality: null,
  queue_now: null,
  observed_at: null,
  age_min: null,
  age_label: "—",
  label_bg: "типично",
  attribution: null,
};

function line(
  lng0: number,
  lat0: number,
  lng1: number,
  lat1: number,
  steps = 40
): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    coords.push([
      lng0 + (lng1 - lng0) * t,
      lat0 + (lat1 - lat0) * t,
    ]);
  }
  return coords;
}

function routeFrom(
  coords: Array<[number, number]>,
  km = 400,
  min = 400
): ProvidedRoadRoute {
  return {
    provider: "valhalla",
    distance_km: km,
    duration_min: min,
    geometry: { type: "LineString", coordinates: coords },
    maneuvers: [],
    alternatives: [],
  };
}

function borderRow(
  id: string,
  name: string,
  chosen: boolean,
  totalMin: number,
  driveMin: number,
  km: number
): ScoredBorder {
  return {
    borderId: id,
    nameBg: name,
    nameEn: name,
    coords: { lng: 22.9, lat: 43.9 },
    ppid: null,
    driveMin,
    distanceKm: km,
    wait,
    communityPenaltyMin: 0,
    totalMin,
    chosen,
    reasonCode: chosen ? "lowest_total" : "slower_than_best",
    reason: "test",
  };
}

describe("route divergence", () => {
  it("counts parallel lines 200 km apart along a 400 km run", () => {
    const primary = line(13, 48, 25, 42);
    const candidate = line(15, 48, 27, 42);
    expect(divergentSampleKm(primary, candidate)).toBeGreaterThanOrEqual(80);
  });

  it("rejects a line that leaves for 30 km and rejoins", () => {
    const primary = line(13, 48, 25, 42);
    const detour = [
      ...line(13, 48, 17, 46, 20),
      ...line(17, 46, 19, 45, 5),
      ...line(19, 45, 25, 42, 20),
    ];
    expect(isMeaningfulDivergence(primary, detour)).toBe(false);
  });

  it("picks Vidin over Kalotina when borders diverge by distance", () => {
    const primaryCoords = line(13, 48, 23.3, 42.7);
    const vidinCoords = line(13, 48, 22.9, 44.1, 30);
    const direct = routeFrom(primaryCoords, 600, 580);
    const vidin = routeFrom(vidinCoords, 710, 620);
    const borders = [
      borderRow("kalotina", "Калотина", true, 620, 580, 600),
      borderRow("vidin", "Видин", false, 650, 620, 710),
    ];
    const options = buildRouteOptions({
      origin: { lng: 13, lat: 48 },
      destination: { lng: 23.3, lat: 42.7 },
      originCountry: "DE",
      destinationCountry: "BG",
      direct,
      viaRoutes: new Map([["vidin", vidin]]),
      onPath: new Set<string>(),
      borders,
      chosenRoute: direct,
      chosenBorder: borders[0]!,
      preferences: DEFAULT_TRIP_PREFERENCES,
    });
    expect(options.alternative?.border_id).toBe("vidin");
  });

  it("returns same_country when ends share a country", () => {
    const options = buildRouteOptions({
      origin: { lng: 23.2, lat: 42.7 },
      destination: { lng: 24.7, lat: 42.1 },
      originCountry: "BG",
      destinationCountry: "BG",
      direct: routeFrom(line(23.2, 42.7, 24.7, 42.1), 120, 90),
      viaRoutes: new Map(),
      onPath: new Set(),
      borders: [],
      chosenRoute: routeFrom(line(23.2, 42.7, 24.7, 42.1), 120, 90),
      chosenBorder: null,
      preferences: DEFAULT_TRIP_PREFERENCES,
    });
    expect(options.alternative).toBeNull();
    expect(options.unavailable_reason).toBe("same_country");
  });

  it("hides Valhalla alternate when avoid_tolls is on", () => {
    const primary = line(13, 48, 25, 42);
    const offset = line(14.5, 48, 26.5, 42);
    const direct: ProvidedRoadRoute = {
      provider: "valhalla",
      distance_km: 400,
      duration_min: 400,
      geometry: { type: "LineString", coordinates: primary },
      maneuvers: [],
      alternatives: [
        {
          distance_km: 430,
          duration_min: 410,
          geometry: { type: "LineString", coordinates: offset },
          weight: 1,
          maneuvers: [],
        },
      ],
    };
    const options = buildRouteOptions({
      origin: { lng: 13, lat: 48 },
      destination: { lng: 25, lat: 42 },
      originCountry: "DE",
      destinationCountry: "BG",
      direct,
      viaRoutes: new Map(),
      onPath: new Set(),
      borders: [],
      chosenRoute: direct,
      chosenBorder: null,
      preferences: { ...DEFAULT_TRIP_PREFERENCES, avoid_tolls: true },
    });
    expect(options.alternative).toBeNull();
    expect(options.unavailable_reason).toBe("constraints");
  });
});