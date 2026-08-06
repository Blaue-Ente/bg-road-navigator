/**
 * Server-side service readiness flags (booleans only — never leak secrets).
 */

import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ServiceId =
  | "supabase"
  | "nakordoni"
  | "windy"
  | "tomtom"
  | "opencharge"
  | "nvidia"
  | "map_style_custom"
  | "osrm_custom"
  | "geocoding_custom"
  | "app_url";

export interface ServiceStatusItem {
  id: ServiceId;
  label: string;
  /** What this unlocks in the product. */
  unlocks: string;
  configured: boolean;
  /** free | freemium | paid | self_host | public */
  cost: "free" | "freemium" | "paid" | "self_host" | "public";
  /** How important for first public release. */
  priority: "required_for_auth" | "recommended" | "optional";
  signup_url?: string;
  env_vars: string[];
}

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/** Ordered catalog for setup UI + status API. */
export function getServiceStatusCatalog(): ServiceStatusItem[] {
  return [
    {
      id: "supabase",
      label: "Supabase (auth + DB)",
      unlocks: "Вход, профил, любими, запазени маршрути, общност (писене)",
      configured: isSupabaseConfigured(),
      cost: "freemium",
      priority: "required_for_auth",
      signup_url: "https://supabase.com/dashboard",
      env_vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    },
    {
      id: "nakordoni",
      label: "Nakordoni",
      unlocks: "Live опашки на границите",
      configured: hasEnv("NAKORDONI_API_KEY"),
      cost: "free",
      priority: "recommended",
      signup_url: "https://nakordoni.eu/en/developers",
      env_vars: ["NAKORDONI_API_KEY"],
    },
    {
      id: "windy",
      label: "Windy Webcams",
      unlocks: "Вградени webcam изображения на граници",
      configured: hasEnv("WINDY_WEBCAMS_API_KEY"),
      cost: "free",
      priority: "optional",
      signup_url: "https://api.windy.com/webcams",
      env_vars: ["WINDY_WEBCAMS_API_KEY"],
    },
    {
      id: "tomtom",
      label: "TomTom",
      unlocks: "Трафик на картата + бензиностанции",
      configured: hasEnv("TOMTOM_API_KEY"),
      cost: "freemium",
      priority: "optional",
      signup_url: "https://developer.tomtom.com/",
      env_vars: ["TOMTOM_API_KEY"],
    },
    {
      id: "opencharge",
      label: "OpenChargeMap",
      unlocks: "EV зарядни станции",
      configured: hasEnv("OPENCHARGE_API_KEY"),
      cost: "freemium",
      priority: "optional",
      signup_url: "https://openchargemap.org/site/develop",
      env_vars: ["OPENCHARGE_API_KEY"],
    },
    {
      id: "nvidia",
      label: "NVIDIA NIM",
      unlocks: "AI план за пътуване (иначе евристика)",
      configured: hasEnv("NVIDIA_API_KEY"),
      cost: "freemium",
      priority: "optional",
      signup_url: "https://build.nvidia.com/",
      env_vars: ["NVIDIA_API_KEY"],
    },
    {
      id: "app_url",
      label: "Публичен URL",
      unlocks: "Supabase Auth redirect URLs / Railway docs",
      configured: hasEnv("NEXT_PUBLIC_APP_URL"),
      cost: "public",
      priority: "recommended",
      env_vars: ["NEXT_PUBLIC_APP_URL"],
    },
    {
      id: "map_style_custom",
      label: "Custom map style",
      unlocks: "Собствен MapLibre style (иначе Carto Dark Matter)",
      configured: hasEnv("NEXT_PUBLIC_MAP_STYLE_URL"),
      cost: "public",
      priority: "optional",
      env_vars: ["NEXT_PUBLIC_MAP_STYLE_URL"],
    },
    {
      id: "osrm_custom",
      label: "Собствен OSRM",
      unlocks: "Production routing (иначе публичен OSRM demo)",
      configured: hasEnv("OSRM_API_URL"),
      cost: "self_host",
      priority: "optional",
      env_vars: ["OSRM_API_URL"],
    },
    {
      id: "geocoding_custom",
      label: "Собствен geocoder",
      unlocks: "Production geocoding (иначе Nominatim + кеш)",
      configured: hasEnv("GEOCODING_API_URL"),
      cost: "self_host",
      priority: "optional",
      env_vars: ["GEOCODING_API_URL"],
    },
  ];
}

export const SUPABASE_MIGRATION_FILES = [
  "001_initial_schema.sql",
  "002_community_pins.sql",
  "004_rls_policies.sql",
  "005_trip_planning.sql",
  "006_community_safety.sql",
  "007_profile_trigger_and_places.sql",
  "008_community_categories_comments.sql",
] as const;

export interface ConfigStatusResponse {
  ok: true;
  generated_at: string;
  /** Always-on without keys. */
  works_without_keys: string[];
  services: ServiceStatusItem[];
  supabase: {
    configured: boolean;
    /** Operator must apply these SQL files once (order matters). */
    migrations_to_apply: readonly string[];
    one_shot_sql: "supabase/apply_all.sql";
  };
  summary: {
    configured_count: number;
    total_count: number;
    missing_recommended: string[];
    ready_for_keys_only: boolean;
  };
}

export function buildConfigStatus(): ConfigStatusResponse {
  const services = getServiceStatusCatalog();
  const configured_count = services.filter((s) => s.configured).length;
  const missing_recommended = services
    .filter(
      (s) =>
        !s.configured &&
        (s.priority === "required_for_auth" || s.priority === "recommended")
    )
    .map((s) => s.id);

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    works_without_keys: [
      "map",
      "osrm_routing_public",
      "geocoding_nominatim",
      "weather_open_meteo",
      "border_estimates",
      "vignette_links",
      "heuristic_trip_plan",
      "tips_hotels_emergency",
    ],
    services,
    supabase: {
      configured: isSupabaseConfigured(),
      migrations_to_apply: SUPABASE_MIGRATION_FILES,
      one_shot_sql: "supabase/apply_all.sql",
    },
    summary: {
      configured_count,
      total_count: services.length,
      missing_recommended,
      /** True when code paths don't need more engineering — only keys + SQL. */
      ready_for_keys_only: true,
    },
  };
}
