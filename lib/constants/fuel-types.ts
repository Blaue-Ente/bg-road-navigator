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
  /** Reference price in EUR per litre (or EUR/kWh for electric). */
  default_price: number;
}

/** BGN/litre defaults were converted once at the Jan 2026 euro adoption peg. */
const BGN_PER_EUR = 1.95583;
function bgnLitreToEur(amount: number): number {
  return Math.round((amount / BGN_PER_EUR) * 100) / 100;
}

export const FUEL_TYPES: FuelTypeInfo[] = [
  {
    type: "diesel",
    labelKey: "diesel",
    unitKey: "unitPerLitre",
    default_price: bgnLitreToEur(2.85),
  },
  {
    type: "petrol95",
    labelKey: "petrol95",
    unitKey: "unitPerLitre",
    default_price: bgnLitreToEur(2.68),
  },
  {
    type: "petrol98",
    labelKey: "petrol98",
    unitKey: "unitPerLitre",
    default_price: bgnLitreToEur(2.95),
  },
  {
    type: "lpg",
    labelKey: "lpg",
    unitKey: "unitPerLitre",
    default_price: bgnLitreToEur(1.45),
  },
  {
    type: "adblue",
    labelKey: "adblue",
    unitKey: "unitPerLitre",
    default_price: bgnLitreToEur(2.1),
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