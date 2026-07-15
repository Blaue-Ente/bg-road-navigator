import type { GeoPoint } from "@/types/route.types";

export type TripStopType =
  | "fuel"
  | "ev_charge"
  | "rest"
  | "overnight";

export type TripStopSource = "calculation" | "curated_rest_area";

export interface TripPlanStop {
  id: string;
  type: TripStopType;
  title: string;
  description: string;
  distance_from_start_km: number;
  estimated_arrival_min: number;
  coords: GeoPoint;
  source: TripStopSource;
  requires_confirmation: boolean;
  booking_url?: string;
}

export interface TripPlan {
  generated_at: string;
  assumptions: {
    driving_break_every_min: number;
    overnight_after_min: number;
    fuel_range_km?: number;
    ev_range_km?: number;
  };
  stops: TripPlanStop[];
  warnings: string[];
}

export interface TripPlannerPreferences {
  vehicle_type: "car" | "ev" | "truck" | "motorcycle";
  fuel_range_km?: number;
  ev_range_km?: number;
  break_every_min?: number;
  overnight_after_min?: number;
}
