import type { GeoPoint } from "@/types/route.types";

export interface FuelPrices {
  diesel?: number;
  petrol95?: number;
  petrol98?: number;
  lpg?: number;
  adblue?: number;
}

export interface FuelStation {
  id: string;
  name: string;
  brand: string;
  coords: GeoPoint;
  address?: string;
  location?: string;
  prices: FuelPrices;
  open: boolean | "unknown";
  distance_km: number;
  payment_methods: string[];
  /** Fuels the station is tagged with (OpenStreetMap), whether or not a price is known. */
  fuel_types?: FuelTypeCode[];
  /** OpenStreetMap `opening_hours` text, shown as written. */
  opening_hours?: string;
  phone?: string;
  /** Where the prices come from, and when they were read. */
  price_source?: "tankerkoenig" | "e-control" | "nakordoni";
  price_observed_at?: string;
}

export type FuelTypeCode =
  | "diesel"
  | "petrol95"
  | "petrol98"
  | "lpg"
  | "cng"
  | "adblue"
  | "e85"
  | "hvo";

export interface EVStation {
  id: string;
  name: string;
  operator: string;
  coords: GeoPoint;
  address?: string;
  power_kw: number;
  connector_types: string[];
  availability: "available" | "unavailable" | "unknown";
  price_kwh: number | null;
  distance_km: number;
}

export interface FuelApiResponse {
  fuelStations: FuelStation[];
  evStations: EVStation[];
  /** True when TomTom / OpenCharge keys are missing (empty results expected). */
  degraded?: boolean;
  mode?: "route" | "bbox" | "default";
  bbox?: { w: number; s: number; e: number; n: number } | null;
}
