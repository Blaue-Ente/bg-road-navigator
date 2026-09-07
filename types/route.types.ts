/**
 * BG Road Navigator — route & geo types.
 * Domain types for borders/fuel/weather/community live in their own files.
 */

export interface GeoPoint {
  lng: number;
  lat: number;
}

export interface RouteWaypoint {
  id: string;
  label: string;
  coords: GeoPoint;
}

/**
 * A searchable European place — curated city, address, hotel,
 * motorway service area, or any geocoded point.
 */
export interface RoutePoint extends RouteWaypoint {
  subtitle?: string;
  source: "curated" | "geocoder" | "user";
}

export interface RouteManeuver {
  instruction_bg: string;
  type: string;
  modifier?: string;
  street?: string;
  distance_m: number;
  duration_s: number;
  coords: GeoPoint;
}

export interface RouteAlternative {
  id: string;
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  weight: number;
  maneuvers?: RouteManeuver[];
}

export interface Route {
  id: string;
  origin: RouteWaypoint;
  destination: RouteWaypoint;
  waypoints: RouteWaypoint[];
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  alternatives: RouteAlternative[];
  routing_source?: "osrm" | "estimate";
  corridor_id?: string;
  /** OSRM steps — list preview only; live turn-by-turn is not enabled in v1. */
  maneuvers?: RouteManeuver[];
}

export interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  origin_label: string;
  origin_coords: GeoPoint;
  destination_label: string;
  destination_coords: GeoPoint;
  waypoints: GeoPoint[];
  route_geojson: GeoJSON.LineString | null;
  distance_km: number | null;
  duration_min: number | null;
  vehicle_type?: "car" | "ev" | "truck" | "motorcycle";
  created_at: string;
}
