import type { VignetteLink } from "@/lib/constants/vignettes";
import type { GeoPoint } from "@/types/route.types";

/** Stable codes Stage 3 can branch on. Bulgarian copy lives in the *_bg fields. */
export type WaitSource =
  "forecast" | "day_stats" | "current" | "local_typical" | "unavailable";

export type StopKind = "fuel" | "charge" | "rest" | "overnight";

export type PlanPriceSource = "e-control" | "tankerkoenig";

export interface NakordoniAttribution {
  text: "Data by nakordoni.eu";
  href: "https://nakordoni.eu/";
  terms: "https://nakordoni.eu/en/p/developer_api_terms";
}

export interface WaitEstimate {
  source: WaitSource;
  /** Always true: Explorer data is delayed, and every fallback is an estimate. */
  estimate: true;
  minutes: number;
  /** What `minutes` counts. Day-stats publishes a typical-week median queue. */
  metric: "wait_min" | "typical_queue" | "none";
  quality: "high" | "low" | null;
  queue_now: number | null;
  observed_at: string | null;
  age_min: number | null;
  age_label: string;
  label_bg: string;
  attribution: NakordoniAttribution | null;
}

export interface BorderChoice {
  border_id: string;
  name_bg: string;
  name_en: string;
  coords: GeoPoint;
  ppid: string | null;
  drive_min: number;
  distance_km: number;
  community_penalty_min: number;
  total_min: number;
  chosen: boolean;
  reason_code: "lowest_total" | "slower_than_best";
  reason: string;
  wait: WaitEstimate;
}

export interface PlanPrice {
  amount: number;
  currency: "EUR";
  unit: "L";
  source: PlanPriceSource;
  observed_at: string;
}

export interface PlanStop {
  id: string;
  kinds: StopKind[];
  title: string;
  reason: string;
  coords: GeoPoint;
  distance_from_start_km: number;
  /** Driving time from departure, excluding border wait. */
  driving_min: number;
  eta: string;
  detour_km: number | null;
  brand: string | null;
  place_name: string | null;
  on_motorway_service: boolean;
  place_source: "openstreetmap" | "openchargemap" | "calculated";
  price: PlanPrice | null;
  /** "price unknown" when `price` is null. Never a guessed amount. */
  price_note: "price unknown" | null;
  /** False on overnight stops. Hotel ratings are not wired up. */
  ratings_available: false | null;
  lodging_note: string | null;
}

export interface CommunityNote {
  id: string;
  category: string;
  title: string;
  penalty_min: number;
  distance_km: number;
  age_label: string;
}

export interface TripPlannerResult {
  generated_at: string;
  planner: "deterministic";
  depart_at: string;
  vehicle: {
    vehicle_type: "car" | "ev" | "truck" | "motorcycle";
    fuel_type: "diesel" | "petrol" | "lpg" | "electric";
    energy: "fuel" | "charge";
    capacity: number;
    consumption_per_100: number;
    level: number;
    reserve: number;
    from_profile: boolean;
  };
  route: {
    distance_km: number;
    duration_min: number;
    total_min: number;
    routing_source: "valhalla" | "osrm";
    origin: { label: string; lng: number; lat: number };
    destination: { label: string; lng: number; lat: number };
    geometry: GeoJSON.LineString;
    border_waypoint: { label: string; lng: number; lat: number } | null;
  };
  border: {
    chosen: BorderChoice | null;
    alternatives: BorderChoice[];
    note: string;
  };
  stops: PlanStop[];
  community: {
    penalty_min: number;
    notes: CommunityNote[];
  };
  tolls: VignetteLink[];
  export: {
    google_url: string | null;
    apple_url: string | null;
    waze_url: string | null;
    leg_count: number;
  };
  warnings: string[];
}
