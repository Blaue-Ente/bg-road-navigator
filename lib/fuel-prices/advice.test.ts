import { describe, expect, it } from "vitest";
import { buildFuelAdvice, fillLiters } from "@/lib/fuel-prices/advice";
import { resolveVehicle } from "@/lib/planner/vehicle";

describe("fuel advice", () => {
  it("estimates the fill against an official national average", () => {
    const vehicle = resolveVehicle({
      fuel_type: "diesel",
      tank_capacity_liters: 50,
      reserve: 0.2,
    });
    const advice = buildFuelAdvice({
      stationPerL: 1.4,
      nationalAvgPerL: 1.55,
      liters: fillLiters(vehicle),
      basis: "official",
    });
    expect(fillLiters(vehicle)).toBe(40);
    expect(advice).toMatchObject({
      cheaper_than_avg_per_l: 0.15,
      est_savings_eur: 6,
      basis: "official",
    });
  });

  it("uses the same shape for a community price", () => {
    const advice = buildFuelAdvice({
      stationPerL: 1.7,
      nationalAvgPerL: 1.55,
      liters: 40,
      basis: "community",
    });
    expect(advice?.basis).toBe("community");
    expect(advice?.est_savings_eur).toBeLessThan(0);
  });
});
