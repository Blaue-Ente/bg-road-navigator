import type { GeoPoint } from "@/types/route.types";

export interface WeatherPoint {
  coords: GeoPoint;
  temperature_c: number;
  condition: string;
  wind_kmh: number;
  precipitation_mm: number;
  visibility_km: number;
  icon: string;
  label?: string;
  distance_from_origin_km?: number;
  eta_min?: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  coords?: GeoPoint;
}
