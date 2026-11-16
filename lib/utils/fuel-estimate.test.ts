import { describe, expect, it } from "vitest";
import { estimateRouteFuel } from "@/lib/utils/fuel-estimate";
import type { Profile } from "@/types/profile.types";

const dieselCar: Profile = {
  id: "u1",
  username: "test",
  display_name: "test",
  home_city: null,
  usual_country: null,
  car: null,
  avatar_url: null,
  vehicle_type: "car",
  fuel_type: "diesel",
  tank_capacity_liters: 55,
  ev_range_km: null,
  trip_preferences: null,
};

describe("estimateRouteFuel", () => {
  it("returns null for non-positive distance", () => {
    expect(estimateRouteFuel(0, dieselCar)).toBeNull();
  });

  it("uses diesel consumption for a diesel car", () => {
    const estimate = estimateRouteFuel(200, dieselCar);
    expect(estimate?.unit).toBe("L");
    expect(estimate?.fuel_needed).toBe(13);
    expect(estimate?.disclaimer_bg).toContain("Оценка");
  });

  it("returns EUR cost, not BGN", () => {
    const estimate = estimateRouteFuel(1000, dieselCar);
    expect(estimate?.cost_eur).toBeGreaterThan(0);
    expect(estimate?.cost_eur_formatted).toMatch(/€|EUR/);
    expect(estimate?.cost_bgn).toBeUndefined();
  });
});
