import { z } from "zod";

export type VehicleKind = "car" | "ev" | "truck" | "motorcycle";
export type VehicleFuel = "diesel" | "petrol" | "lpg" | "electric";
export type ConsumptionSource = "manual" | "fueleconomy.gov" | "estimate";

export interface UserVehicle {
  id: string;
  name: string;
  vehicle_type: VehicleKind;
  fuel_type: VehicleFuel;
  tank_capacity_liters: number | null;
  ev_range_km: number | null;
  /** Extra-urban average. L/100 km, or kWh/100 km for an electric car. */
  consumption_per_100: number | null;
  consumption_source: ConsumptionSource;
  is_active: boolean;
}

export const VehicleInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  vehicle_type: z.enum(["car", "ev", "truck", "motorcycle"]).default("car"),
  fuel_type: z.enum(["diesel", "petrol", "lpg", "electric"]).default("diesel"),
  tank_capacity_liters: z.number().finite().min(8).max(1500).nullable().optional(),
  ev_range_km: z.number().int().min(50).max(2000).nullable().optional(),
  consumption_per_100: z.number().finite().min(1).max(80).nullable().optional(),
  consumption_source: z
    .enum(["manual", "fueleconomy.gov", "estimate"])
    .default("manual"),
  is_active: z.boolean().optional(),
});

export const VehiclePatchSchema = VehicleInputSchema.partial();

export type VehicleInput = z.infer<typeof VehicleInputSchema>;

export interface ConsumptionCandidate {
  label: string;
  year: number;
  /** Highway average, L/100 km or kWh/100 km. */
  highway_per_100: number;
  combined_per_100: number | null;
  fuel_type: VehicleFuel;
  vehicle_type: VehicleKind;
  ev_range_km: number | null;
  source: "fueleconomy.gov" | "estimate";
  /** Tank size when the source knows it. */
  tank_capacity_liters?: number | null;
}
