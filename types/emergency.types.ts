import type { GeoPoint } from "@/types/route.types";

export interface CountryEmergency {
  country: string;
  country_bg: string;
  flag: string;
  police: string;
  ambulance: string;
  fire: string;
  roadside_assistance: string;
  roadside_assistance_name: string;
  eu_emergency: "112";
  towing_service: string;
  notes_bg: string;
}

export interface NearbyPlace {
  id: string;
  kind: "hospital" | "garage";
  name: string;
  address?: string;
  phone?: string;
  coords: GeoPoint;
  distance_km?: number;
  maps_url: string;
  source: "openstreetmap";
}
