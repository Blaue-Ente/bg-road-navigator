import { describe, expect, it } from "vitest";
import { attachStops } from "@/lib/planner/attach-stops";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import { annotatePlaces, pickPlace } from "@/lib/planner/pick-place";
import { resolveVehicle } from "@/lib/planner/vehicle";
import type { CorridorPlace } from "@/lib/poi/types";

const line: Array<[number, number]> = [
  [23.3, 42.7],
  [24.0, 42.4],
  [24.7, 42.1],
];

describe("named stops", () => {
  it("picks the named station inside the fuel window over a house-number-only detour", () => {
    const places = annotatePlaces(line, 120, [
      corridor({
        id: "far",
        name: "Бензиностанция",
        kind: "fuel",
        lat: 42.9,
        lng: 23.0,
        alongM: 10_000,
        distM: 8_000,
      }),
      corridor({
        id: "omv",
        name: "OMV Ихтиман",
        kind: "fuel",
        lat: 42.45,
        lng: 23.8,
        alongM: 70_000,
        distM: 400,
      }),
    ]);
    const chosen = pickPlace(places, DEFAULT_TRIP_PREFERENCES, {
      kinds: ["fuel"],
      windowStartKm: 40,
      windowEndKm: 90,
    });
    expect(chosen?.id).toBe("omv");
  });

  it("recommends the station that saves more against the national average", () => {
    const vehicle = resolveVehicle({
      fuel_type: "diesel",
      tank_capacity_liters: 50,
      reserve: 0.2,
      level: 0.3,
    });
    const places = annotatePlaces(line, 200, [
      corridor({
        id: "dear",
        name: "Скъпа",
        kind: "fuel",
        lat: 42.5,
        lng: 23.7,
        alongM: 40_000,
        distM: 300,
      }),
      corridor({
        id: "cheap",
        name: "Евтина",
        kind: "fuel",
        lat: 42.48,
        lng: 23.75,
        alongM: 45_000,
        distM: 500,
      }),
    ]).map((place) => ({
      ...place,
      priceAmount: place.id === "cheap" ? 1.4 : 1.7,
      priceBasis: "official" as const,
      priceSource: "e-control" as const,
      observedAt: "2026-11-14T00:00:00.000Z",
    }));

    const { attachments } = attachStops({
      merged: [{ kinds: ["fuel", "rest"], distanceKm: 80, etaMin: 70 }],
      places,
      preferences: DEFAULT_TRIP_PREFERENCES,
      vehicle,
      driveMin: 180,
      distanceKm: 200,
      countryAt: () => "AT",
      averagePerLitre: () => 1.6,
    });
    expect(attachments[0]?.placeId).toBe("cheap");
    expect(attachments[0]?.source).toBe("osm");
    expect(attachments[0]?.advice).toMatchObject({
      basis: "official",
      cheaper_than_avg_per_l: 0.2,
    });
    expect(attachments[0]?.name).toBe("Евтина");
  });
});

function corridor(input: {
  id: string;
  name: string;
  kind: CorridorPlace["kind"];
  lat: number;
  lng: number;
  alongM: number;
  distM: number;
}): CorridorPlace {
  return {
    id: input.id,
    name: input.name,
    brand: null,
    lat: input.lat,
    lng: input.lng,
    kind: input.kind,
    motorwayService: false,
    tags: {},
    alongM: input.alongM,
    distM: input.distM,
    source: "poi",
  };
}
