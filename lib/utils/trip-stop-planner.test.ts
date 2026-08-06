import { describe, expect, it } from "vitest";
import { buildTripPlan } from "@/lib/utils/trip-stop-planner";
import type { Route } from "@/types/route.types";

const sampleRoute: Route = {
  id: "test-route",
  origin: {
    id: "sofia",
    label: "София",
    coords: { lng: 23.32, lat: 42.7 },
  },
  destination: {
    id: "vienna",
    label: "Виена",
    coords: { lng: 16.37, lat: 48.21 },
  },
  waypoints: [],
  distance_km: 1000,
  duration_min: 600,
  geometry: {
    type: "LineString",
    coordinates: [
      [23.32, 42.7],
      [20.5, 44.8],
      [19.0, 47.5],
      [16.37, 48.21],
    ],
  },
  alternatives: [],
  routing_source: "estimate",
};

describe("buildTripPlan", () => {
  it("returns rest and fuel stops for a long car trip", () => {
    const plan = buildTripPlan(sampleRoute, {
      vehicle_type: "car",
      fuel_range_km: 500,
      break_every_min: 180,
      overnight_after_min: 540,
    });

    expect(plan.stops.length).toBeGreaterThan(0);
    expect(plan.stops.some((s) => s.type === "rest")).toBe(true);
    expect(plan.stops.some((s) => s.type === "fuel")).toBe(true);
    expect(plan.assumptions.fuel_range_km).toBe(500);
  });
});
