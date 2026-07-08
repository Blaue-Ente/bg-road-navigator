/**
 * BG Road Navigator - Fuel Types Configuration
 */

export type FuelType = 
  | "diesel" 
  | "petrol95" 
  | "petrol98" 
  | "lpg" 
  | "adblue" 
  | "electric";

export interface FuelTypeInfo {
  type: FuelType;
  label_bg: string;
  unit: string;
  default_price: number;
}

export const FUEL_TYPES: FuelTypeInfo[] = [
  {
    type: "diesel",
    label_bg: "Дизел",
    unit: "лв/л",
    default_price: 2.85
  },
  {
    type: "petrol95",
    label_bg: "Бензин 95",
    unit: "лв/л",
    default_price: 2.68
  },
  {
    type: "petrol98",
    label_bg: "Бензин 98",
    unit: "лв/л",
    default_price: 2.95
  },
  {
    type: "lpg",
    label_bg: "Газ (LPG)",
    unit: "лв/л",
    default_price: 1.45
  },
  {
    type: "adblue",
    label_bg: "AdBlue",
    unit: "лв/л",
    default_price: 2.10
  },
  {
    type: "electric",
    label_bg: "Електричество",
    unit: "лв/кВтч",
    default_price: 0.85
  }
];

export const FUEL_TYPE_MAP: Record<FuelType, FuelTypeInfo> = 
  FUEL_TYPES.reduce((acc, info) => {
    acc[info.type] = info;
    return acc;
  }, {} as Record<FuelType, FuelTypeInfo>);