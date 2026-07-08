/**
 * BG Road Navigator - Type Definitions
 */

// Geo coordinates
export interface GeoPoint {
  lng: number;
  lat: number;
}

// Route types
export interface RouteWaypoint {
  id: string;
  label: string;
  coords: GeoPoint;
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
}

export interface RouteAlternative {
  id: string;
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  weight: number;
}

// Traffic types
export interface TrafficIncident {
  id: string;
  type: "ACCIDENT" | "ROAD_WORKS" | "WEATHER" | "CONGESTION" | "CLOSURE" | "OTHER";
  title: string;
  description: string;
  coords: GeoPoint;
  severity: "low" | "medium" | "high" | "critical";
  delay_min: number;
  timestamp: string;
}

// Border types
export interface BorderStatus {
  crossing_id: string;
  name_bg: string;
  wait_time_cars: number;
  wait_time_trucks: number;
  wait_time_buses: number;
  avg_wait_by_hour: number[];
  working_hours: string;
  status: "green" | "yellow" | "orange" | "red";
  last_updated: string;
}

// Fuel types
export interface FuelStation {
  id: string;
  name: string;
  brand: string;
  coords: GeoPoint;
  address: string;
  diesel_price: number | null;
  petrol95_price: number | null;
  petrol98_price: number | null;
  lpg_price: number | null;
  adblue_price: number | null;
  open: boolean;
  distance_km: number;
  payment_methods: string[];
}

// EV types
export interface EVStation {
  id: string;
  name: string;
  operator: string;
  coords: GeoPoint;
  power_kw: number;
  connector_types: string[];
  available: boolean;
  price_kwh: number | null;
  distance_km: number;
}

// Weather types
export interface WeatherPoint {
  coords: GeoPoint;
  temperature_c: number;
  condition: string;
  wind_kmh: number;
  precipitation_mm: number;
  visibility_km: number;
  icon: string;
}

// Community types
export interface CommunityPin {
  id: string;
  user_id: string | null;
  category: "police" | "accident" | "hazard" | "road_works" | "traffic_jam" | "fuel_issue" | "border_info" | "rest_area" | "point_of_interest" | "other";
  title: string;
  description: string | null;
  coords: GeoPoint;
  is_verified: boolean;
  upvotes: number;
  expires_at: string | null;
  created_at: string;
}

export interface PinComment {
  id: string;
  pin_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
}

// Profile types
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  vehicle_type: "car" | "ev" | "truck" | "motorcycle";
  fuel_type: "diesel" | "petrol" | "lpg" | "electric";
  tank_capacity_liters: number | null;
  ev_range_km: number | null;
}

// Saved route types
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
  distance_km: number;
  duration_min: number;
  created_at: string;
}