export type PlannerVehicleType = "car" | "ev" | "truck" | "motorcycle";
export type PlannerFuelType = "diesel" | "petrol" | "lpg" | "electric";

export interface VehicleInput {
  vehicle_type?: PlannerVehicleType | null;
  fuel_type?: PlannerFuelType | null;
  tank_capacity_liters?: number | null;
  ev_range_km?: number | null;
  consumption_per_100?: number | null;
  level?: number | null;
  reserve?: number | null;
}

export interface ResolvedVehicle {
  vehicle_type: PlannerVehicleType;
  fuel_type: PlannerFuelType;
  energy: "fuel" | "charge";
  /** Litres, or kWh for an electric car. */
  capacity: number;
  consumption_per_100: number;
  /** Fraction of capacity on departure, 0–1. */
  level: number;
  /** Fraction of capacity kept in reserve, 0–1. */
  reserve: number;
}

const DEFAULT_LEVEL = 0.8;
const DEFAULT_RESERVE = 0.15;

/** Sensible car defaults when the profile has no tank or consumption. */
const DEFAULTS: Record<
  PlannerFuelType,
  { per100: number; tank: number; vehicle: PlannerVehicleType }
> = {
  diesel: { per100: 6.5, tank: 55, vehicle: "car" },
  petrol: { per100: 7.2, tank: 50, vehicle: "car" },
  lpg: { per100: 9.2, tank: 45, vehicle: "car" },
  electric: { per100: 18, tank: 60, vehicle: "ev" },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function resolveVehicle(input: VehicleInput = {}): ResolvedVehicle {
  const fuelType =
    input.fuel_type ?? (input.vehicle_type === "ev" ? "electric" : "diesel");
  const vehicleType =
    input.vehicle_type ?? (fuelType === "electric" ? "ev" : "car");
  const energy =
    fuelType === "electric" || vehicleType === "ev" ? "charge" : "fuel";
  const base = DEFAULTS[energy === "charge" ? "electric" : fuelType];

  let consumption = input.consumption_per_100 ?? base.per100;
  if (
    vehicleType === "truck" &&
    energy === "fuel" &&
    input.consumption_per_100 == null
  ) {
    consumption = 28;
  }
  if (
    vehicleType === "motorcycle" &&
    energy === "fuel" &&
    input.consumption_per_100 == null
  ) {
    consumption = 4.5;
  }
  consumption = clamp(consumption, 1, 80);

  let capacity = input.tank_capacity_liters ?? base.tank;
  if (vehicleType === "truck" && input.tank_capacity_liters == null)
    capacity = 400;
  if (vehicleType === "motorcycle" && input.tank_capacity_liters == null)
    capacity = 15;
  if (energy === "charge") {
    const range = input.ev_range_km ?? 320;
    capacity = (range * consumption) / 100;
  }
  capacity = clamp(
    capacity,
    energy === "charge" ? 10 : 8,
    energy === "charge" ? 200 : 1500
  );

  const level = clamp(input.level ?? DEFAULT_LEVEL, 0.02, 1);
  const reserve = clamp(input.reserve ?? DEFAULT_RESERVE, 0.05, 0.4);

  return {
    vehicle_type:
      energy === "charge" ? "ev" : vehicleType === "ev" ? "car" : vehicleType,
    fuel_type: energy === "charge" ? "electric" : fuelType,
    energy,
    capacity: Math.round(capacity * 10) / 10,
    consumption_per_100: Math.round(consumption * 10) / 10,
    level: Math.round(level * 1000) / 1000,
    reserve: Math.round(reserve * 1000) / 1000,
  };
}

/** Kilometres until `reserve` is reached, from the current level. */
export function kmUntilReserve(vehicle: ResolvedVehicle): number {
  const usable = vehicle.level - vehicle.reserve;
  if (usable <= 0) return 0;
  return (usable * vehicle.capacity * 100) / vehicle.consumption_per_100;
}
