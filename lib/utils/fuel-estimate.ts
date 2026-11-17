import { FUEL_TYPE_MAP, fuelTypeLabel, fuelTypeUnit } from "@/lib/constants/fuel-types";
import type { Locale } from "@/lib/i18n/locale";
import { catalog, localeTag } from "@/lib/i18n/locale";
import type { Profile } from "@/types/profile.types";
import type { UserVehicle } from "@/lib/vehicles/types";

export interface FuelEstimate {
  distance_km: number;
  consumption_per_100: number;
  unit: "L" | "kWh";
  fuel_needed: number;
  /** @deprecated Use `cost_eur` — retained for older callers. */
  cost_bgn?: number;
  cost_eur: number;
  cost_eur_formatted: string;
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

/** The car the driver picked: its own average consumption wins over class defaults. */
function consumptionForVehicle(
  vehicle: Pick<
    UserVehicle,
    "vehicle_type" | "fuel_type" | "consumption_per_100"
  >
) {
  const base = consumptionForProfile(vehicle as unknown as Profile);
  const priceKey: keyof typeof FUEL_TYPE_MAP =
    vehicle.fuel_type === "electric"
      ? "electric"
      : vehicle.fuel_type === "diesel"
        ? "diesel"
        : vehicle.fuel_type === "lpg"
          ? "lpg"
          : "petrol95";
  const unit: "L" | "kWh" = vehicle.fuel_type === "electric" ? "kWh" : "L";
  return {
    per100: vehicle.consumption_per_100 ?? base.per100,
    unit,
    priceKey,
  };
}

export function formatFuelCostEur(amount: number, locale: Locale = "bg"): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function estimateRouteFuel(
  distanceKm: number,
  profile?: Profile | null,
  locale: Locale = "bg",
  vehicle?: UserVehicle | null
): FuelEstimate | null {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  const spec = vehicle
    ? consumptionForVehicle(vehicle)
    : consumptionForProfile(profile);
  const price = FUEL_TYPE_MAP[spec.priceKey];
  const fuelNeeded = (distanceKm / 100) * spec.per100;
  const costEur = fuelNeeded * price.default_price;
  const roundedCost = Math.round(costEur * 100) / 100;
  const label = fuelTypeLabel(spec.priceKey, locale);
  const unit = fuelTypeUnit(spec.priceKey, locale);
  return {
    distance_km: Math.round(distanceKm),
    consumption_per_100: spec.per100,
    unit: spec.unit,
    fuel_needed: Math.round(fuelNeeded * 10) / 10,
    cost_eur: roundedCost,
    cost_eur_formatted: formatFuelCostEur(roundedCost, locale),
    price_per_unit: price.default_price,
    price_label: `${label} (${unit})`,
    disclaimer_bg: catalog(locale).fuel.estimateDisclaimer,
  };
}