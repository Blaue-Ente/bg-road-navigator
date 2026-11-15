import type { FuelAdvice } from "@/lib/planner/types";
import type { ResolvedVehicle } from "@/lib/planner/vehicle";

/** Litres to fill from the reserve up to a full tank. The stop is planned at the reserve. */
export function fillLiters(vehicle: ResolvedVehicle): number {
  const fraction = Math.max(0, 1 - vehicle.reserve);
  return Math.round(vehicle.capacity * fraction * 10) / 10;
}

export function buildFuelAdvice(input: {
  stationPerL: number;
  nationalAvgPerL: number;
  liters: number;
  basis: FuelAdvice["basis"];
}): FuelAdvice | null {
  if (
    !Number.isFinite(input.stationPerL) ||
    !Number.isFinite(input.nationalAvgPerL) ||
    input.liters <= 0
  ) {
    return null;
  }
  const cheaper = round3(input.nationalAvgPerL - input.stationPerL);
  return {
    cheaper_than_avg_per_l: cheaper,
    est_savings_eur: round2(cheaper * input.liters),
    basis: input.basis,
    liters: round2(input.liters),
    national_avg_per_l: round3(input.nationalAvgPerL),
    station_per_l: round3(input.stationPerL),
  };
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
