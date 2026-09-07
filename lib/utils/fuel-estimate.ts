import { FUEL_TYPE_MAP } from "@/lib/constants/fuel-types";
import type { Profile } from "@/types/profile.types";

export interface FuelEstimate {
  distance_km: number;
  consumption_per_100: number;
  unit: "L" | "kWh";
  fuel_needed: number;
  cost_bgn: number;
  price_per_unit: number;
  price_label: string;
  disclaimer_bg: string;
}

const DEFAULT_CONSUMPTION: Record<
  Profile["vehicle_type"],
  { per100: number; unit: "L" | "kWh"; priceKey: keyof typeof FUEL_TYPE_MAP }
> = {
  car: { per100: 7.2, unit: "L", priceKey: "petrol95" },
  ev: { per100: 18, unit: "kWh", priceKey: "electric" },
  truck: { per100: 28, unit: "L", priceKey: "diesel" },
  motorcycle: { per100: 4.5, unit: "L", priceKey: "petrol95" },
};

function consumptionForProfile(profile: Profile | null | undefined) {
  const vehicle = profile?.vehicle_type ?? "car";
  const base = DEFAULT_CONSUMPTION[vehicle];
  if (vehicle === "ev") return base;
  if (profile?.fuel_type === "diesel") {
    return {
      per100: vehicle === "truck" ? 28 : 6.5,
      unit: "L" as const,
      priceKey: "diesel" as const,
    };
  }
  if (profile?.fuel_type === "lpg") {
    return { per100: 9.2, unit: "L" as const, priceKey: "lpg" as const };
  }
  if (profile?.fuel_type === "petrol") {
    return {
      per100: vehicle === "motorcycle" ? 4.5 : 7.2,
      unit: "L" as const,
      priceKey: "petrol95" as const,
    };
  }
  return base;
}

export function estimateRouteFuel(
  distanceKm: number,
  profile?: Profile | null
): FuelEstimate | null {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  const spec = consumptionForProfile(profile);
  const price = FUEL_TYPE_MAP[spec.priceKey];
  const fuelNeeded = (distanceKm / 100) * spec.per100;
  const cost = fuelNeeded * price.default_price;
  return {
    distance_km: Math.round(distanceKm),
    consumption_per_100: spec.per100,
    unit: spec.unit,
    fuel_needed: Math.round(fuelNeeded * 10) / 10,
    cost_bgn: Math.round(cost * 10) / 10,
    price_per_unit: price.default_price,
    price_label: `${price.label_bg} (${price.unit})`,
    disclaimer_bg:
      "Оценка по среден разход и референтна цена за България — не е реална цена на станция.",
  };
}
