import type { GeoPoint } from "@/types/route.types";

export interface WeatherPoint {
  coords: GeoPoint;
  temperature_c: number;
  condition: string;
  wind_kmh: number;
  precipitation_mm: number;
  visibility_km: number;
  icon: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  coords?: GeoPoint;
}
