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
}

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
}
