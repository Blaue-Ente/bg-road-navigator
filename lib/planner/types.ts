import type { RouteManeuver } from "@/types/route.types";
import type { VignetteLink } from "@/lib/constants/vignettes";
import type { PriceBand } from "@/lib/fuel-prices/bands";
import type { RoadHazard } from "@/lib/hazards/types";
import type { Hotspot } from "@/lib/hotspots/types";
import type { TripPreferences } from "@/lib/planner/preferences";
import type { GeoPoint } from "@/types/route.types";
import type { Locale } from "@/lib/i18n/locale";

/** Stable codes Stage 3 can branch on. Bulgarian copy lives in the *_bg fields. */
export type WaitSource =
  | "forecast"
  | "day_stats"
  | "current"
  | "local_typical"
  | "unavailable"
  | "hatarinfo";

export type StopKind = "fuel" | "charge" | "rest" | "overnight" | "sight";

export type PlanPriceSource =
  | "e-control"
  | "tankerkoenig"
  | "nakordoni"
  | "community";

export type { PriceBand };

/** National Weekly Oil Bulletin figure for one country on this route. */
export interface FuelCountryAverage {
  country_code: string;
  /** Historic name; holds text in the plan's locale. */
  country_name_bg: string;
  fuel: "diesel" | "petrol" | "lpg" | "electric";
  price_eur_per_l: number | null;
  week: string | null;
  /** Historic name; holds text in the plan's locale. */
  week_label_bg: string | null;
  source: "ec-oil-bulletin" | "fuelo" | null;
  /** Historic name; holds text in the plan's locale. */
  source_label_bg: string;
  /** Historic name; holds text in the plan's locale. */
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
  link_label?: string | null;
  link_role?: "shop" | "info" | null;
  charge_kind?: "vignette" | "distance_toll";
  validity_bg?: string | null;
  checked_on?: string | null;
}

export interface SafetyNote {
  id: string;
  kind: "law" | "advice";
  title: string;
  detail: string;
}

export interface PlanChecklist {
  vignettes: ChecklistItem[];
  toll_sections: ChecklistItem[];
  documents: ChecklistItem[];
  winter: ChecklistItem[];
  kit: ChecklistItem[];
  /** Bulgarian rules. Empty when the route does not enter Bulgaria. */
  safety: SafetyNote[];
  safety_closing: string | null;
  /** Official pages for the Bulgarian part of the trip. No scraping. */
  bg_links: ChecklistItem[];
}

export interface RouteWeatherSegment {
  eta: string;
  lat: number;
  lng: number;
  distance_from_start_km: number;
  /** Expected whereabouts at `eta`, e.g. "Niš, Serbia". Absent on older saved plans. */
  place?: string | null;
  temperature_c: number | null;
  weather_code: number | null;
  wind_kmh: number | null;
  precipitation_mm: number | null;
  /** Historic name; holds text in the plan's locale. */
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
    | "border_wait"
    | "time_delta"
    | "distance_delta"
    | "incident"
    | "preference"
    | "road_hazard"
    | "attention_segment";
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
  text: string;
  href: string;
  terms: string;
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
  /** Wait at departure-time "now" when it differs from arrival-time wait. */
  now_minutes?: number | null;
  /** Border reach instant used for the arrival wait estimate. */
  eta_iso?: string | null;
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
  reason_code:
    | "lowest_total"
    | "slower_than_best"
    | "preferred"
    | "serbia_hungary"
    | "on_path";
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
  /** Historic name; holds text in the plan's locale. */
  average_label_bg: string | null;
  /** Historic name; holds text in the plan's locale. */
  price_label_bg: string | null;
  /** Historic name; holds text in the plan's locale. */
  price_delta_label_bg: string | null;
  /** Historic name; holds text in the plan's locale. */
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
  /** Minutes asleep after this stop; set only on the overnight anchor stop. */
  sleep_min?: number | null;
  /** IANA zone for the 08:00 wake after this overnight stop. */
  wake_time_zone?: string | null;
  /** Minutes spent at this stop off the driving clock. */
  dwell_min?: number | null;
  /** IANA zone at this stop for display. */
  time_zone?: string | null;
}

export interface CommunityNote {
  id: string;
  category: string;
  title: string;
  penalty_min: number;
  distance_km: number;
  age_label: string;
}

export type RouteChoice =
  | { kind: "border"; border_id: string }
  | { kind: "valhalla_alternate" };

export interface RouteOptionSummary {
  id: "primary" | "alternative";
  role: "primary" | "alternative";
  source: "border" | "valhalla" | "direct";
  border_id: string | null;
  label: string;
  distance_km: number;
  drive_min: number;
  wait_min: number;
  total_min: number;
  countries: string[];
  vignette_codes: string[];
  toll_codes: string[];
  geometry: GeoJSON.LineString;
}

export interface RouteOptionsBlock {
  primary: RouteOptionSummary;
  alternative: RouteOptionSummary | null;
  unavailable_reason:
    | null
    | "same_country"
    | "too_short"
    | "no_divergent_path"
    | "constraints";
}

export interface TripPlannerResult {
  generated_at: string;
  planner: "deterministic";
  /** Present on new plans; text fields match this locale. */
  locale?: Locale;
  depart_at: string;
  vehicle: {
    /** The garage car this plan was made for, when one was used. */
    vehicle_id?: string | null;
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
    /** Wall-clock arrival at destination, including overnight sleep. */
    arrive_at?: string;
    /** Sum of stop dwell minutes on the route. */
    breaks_min?: number;
    routing_source: "valhalla" | "osrm";
    origin: {
      label: string;
      lng: number;
      lat: number;
      time_zone?: string;
    };
    destination: {
      label: string;
      lng: number;
      lat: number;
      time_zone?: string;
    };
    geometry: GeoJSON.LineString;
    /** Turn list for the beta "next turn" view. Absent on older plans. */
    maneuvers?: RouteManeuver[];
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
  /** АПИ situations on the Bulgarian part of the route. Empty when none match. */
  road_hazards: RoadHazard[];
  road_hazard_attribution: string | null;
  /** Clustered injury and fatal accidents on the driven line. */
  attention_segments: Hotspot[];
  attention_attribution: string | null;
  weather: RouteWeather;
  why_this_route: WhyReason[];
  recommended_fuel: { stop_id: string; advice: FuelAdvice } | null;
  route_options?: RouteOptionsBlock;
}
