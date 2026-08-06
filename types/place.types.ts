import type { GeoPoint } from "@/types/route.types";

export type SavedPlaceCategory =
  | "home"
  | "work"
  | "favorite"
  | "overnight"
  | "fuel"
  | "ev_charge"
  | "border"
  | "food"
  | "rest"
  | "other";

/** Shape stored in saved_places.place jsonb */
export interface SavedPlacePayload {
  coords: GeoPoint;
  address?: string;
  subtitle?: string;
  external_id?: string;
  brand?: string;
  crossing_id?: string;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  label: string;
  place: SavedPlacePayload;
  category: SavedPlaceCategory;
  created_at: string;
}
