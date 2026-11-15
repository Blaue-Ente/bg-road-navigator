import type { VignetteLink } from "@/lib/constants/vignettes";
import type { PriceBand } from "@/lib/fuel-prices/bands";
import type { TripPreferences } from "@/lib/planner/preferences";
import type { GeoPoint } from "@/types/route.types";

/** Stable codes Stage 3 can branch on. Bulgarian copy lives in the *_bg fields. */
export type WaitSource =
  "forecast" | "day_stats" | "current" | "local_typical" | "unavailable";

export type StopKind = "fuel" | "charge" | "rest" | "overnight" | "sight";

export type PlanPriceSource = "e-control" | "tankerkoenig" | "community";

export type { PriceBand };

/** National Weekly Oil Bulletin figure for one country on this route. */
export interface FuelCountryAverage {
  country_code: string;
  country_name_bg: string;
  fuel: "diesel" | "petrol" | "lpg" | "electric";
  price_eur_per_l: number | null;
  week: string | null;
  week_label_bg: string | null;
  source: "ec-oil-bulletin" | null;
  source_label_bg: string;
  label_bg: string;
}

export interface FuelAdvice {
  cheaper_than_avg_per_l: number;
  est_savings_eur: number;
  basis: "official" | "community";
  liters: number;
  national_avg_per_l: number;
  station_per_l: number;
}

export interface PlaceFlagSummary {
  flag: string;
  weight: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  detail: string;
  country_code: string | null;
  href: string | null;
}

export interface PlanChecklist {
  vignettes: ChecklistItem[];
  toll_sections: ChecklistItem[];
  documents: ChecklistItem[];
  winter: ChecklistItem[];
  kit: ChecklistItem[];
}

export interface RouteWeatherSegment {
  eta: string;
  lat: number;
  lng: number;
  distance_from_start_km: number;
  temperature_c: number | null;
  weather_code: number | null;
  wind_kmh: number | null;
  precipitation_mm: number | null;
  summary_bg: string;
}

export interface RouteWeatherWarning {
  source: "meteoalarm" | "open-meteo";
  severity: "minor" | "moderate" | "severe";
  title: string;
  detail: string;
  country_code: string | null;
}

export interface RouteWeather {
  segments: RouteWeatherSegment[];
  warnings: RouteWeatherWarning[];
  attribution: string;
}

export interface WhyReason {
  code:
    "border_wait" | "time_delta" | "distance_delta" | "incident" | "preference";
  title: string;
  detail: string;
  delta_min: number | null;
  delta_km: number | null;
}

export interface OsmAttribution {
  text: "© OpenStreetMap contributors";
  license: "ODbL";
  href: "https://www.openstreetmap.org/copyright";
}

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
  /** True when both markets of this crossing are outside the Nakordoni license. */
  unlicensed_market?: boolean;
  /** TomTom delay near the crossing. Present only for an unlicensed market. */
  traffic_delay_min?: number | null;
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
  reason_code: "lowest_total" | "slower_than_best" | "preferred";
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
  place_id: string | null;
  place_source: "osm" | "openstreetmap" | "openchargemap" | "calculated";
  price: PlanPrice | null;
  advice: FuelAdvice | null;
  /** Null when the stop is not a fuel stop. Grey means no station price. */
  price_band: PriceBand | null;
  /** National average for this stop's country, e.g. "България: дизел ср. 1,90 €/л". */
  average_label_bg: string | null;
  price_label_bg: string | null;
  price_delta_label_bg: string | null;
  price_source_label_bg: string | null;
  flags: PlaceFlagSummary[];
  /** Scenic sights are optional and can be skipped. */
  optional: boolean;
  /** "price unknown" when `price` is null. Never a guessed amount. */
  price_note: "price unknown" | null;
  /** False on overnight stops. Hotel ratings are not wired up. */
  ratings_available: false | null;
  lodging_note: string | null;
  /** OSM star class, 1–5, when the place tag says so. Null when unknown. */
  stars: number | null;
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
  /** One row per country the route crosses, in travel order. */
  fuel_averages: FuelCountryAverage[];
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
  preferences: TripPreferences;
  attribution: OsmAttribution;
  checklist: PlanChecklist;
  weather: RouteWeather;
  why_this_route: WhyReason[];
  recommended_fuel: { stop_id: string; advice: FuelAdvice } | null;
}
