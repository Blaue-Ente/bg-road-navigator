/**
 * BG Road Navigator - Fuel Types Configuration
 */

import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";

export type FuelType =
  | "diesel"
  | "petrol95"
  | "petrol98"
  | "lpg"
  | "adblue"
  | "electric";

export interface FuelTypeInfo {
  type: FuelType;
  /** Catalog key under `fuel` for the display label. */
  labelKey: keyof ReturnType<typeof catalog>["fuel"];
  unitKey: "unitPerLitre" | "unitPerKwh";
  default_price: number;
}

export const FUEL_TYPES: FuelTypeInfo[] = [
  {
    type: "diesel",
    labelKey: "diesel",
    unitKey: "unitPerLitre",
    default_price: 2.85,
  },
  {
    type: "petrol95",
    labelKey: "petrol95",
    unitKey: "unitPerLitre",
    default_price: 2.68,
  },
  {
    type: "petrol98",
    labelKey: "petrol98",
    unitKey: "unitPerLitre",
    default_price: 2.95,
  },
  {
    type: "lpg",
    labelKey: "lpg",
    unitKey: "unitPerLitre",
    default_price: 1.45,
  },
  {
    type: "adblue",
    labelKey: "adblue",
    unitKey: "unitPerLitre",
    default_price: 2.1,
  },
  {
    type: "electric",
    labelKey: "electric",
    unitKey: "unitPerKwh",
    default_price: 0.85,
  },
];

export const FUEL_TYPE_MAP: Record<FuelType, FuelTypeInfo> = FUEL_TYPES.reduce(
  (acc, info) => {
    acc[info.type] = info;
    return acc;
  },
  {} as Record<FuelType, FuelTypeInfo>
);

export function fuelTypeLabel(type: FuelType, locale: Locale = "bg"): string {
  const info = FUEL_TYPE_MAP[type];
  return catalog(locale).fuel[info.labelKey];
}

export function fuelTypeUnit(type: FuelType, locale: Locale = "bg"): string {
  const info = FUEL_TYPE_MAP[type];
  return catalog(locale).fuel[info.unitKey];
}