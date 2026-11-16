/**
 * Server-side service readiness flags (booleans only — never leak secrets).
 */

import { ociGeoEnvState } from "@/lib/api-clients/oci-geo";
import { isDatabaseConfigured } from "@/lib/db";
import { readPoiConfig } from "@/lib/poi/config";

export type ServiceId =
  | "postgres"
  | "nakordoni"
  | "windy"
  | "tomtom"
  | "opencharge"
  | "tankerkoenig"
  | "nvidia"
  | "google"
  | "apple"
  | "map_style_custom"
  | "osrm_custom"
  | "geocoding_custom"
  | "oci_geo"
  | "oci_poi"
  | "cron_warm"
  | "fuelo"
  | "app_url";

export interface ServiceStatusItem {
  id: ServiceId;
  label: string;
  /** What this unlocks in the product (Bulgarian operator copy). */
  unlocks_bg: string;
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
      id: "postgres",
      label: "Neon Postgres + Better Auth",
      unlocks_bg: "Вход, профил, любими, запазени маршрути и общност",
      configured: isDatabaseConfigured(),
      cost: "freemium",
      priority: "required_for_auth",
      signup_url: "https://neon.tech",
      env_vars: [
        "DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "BETTER_AUTH_URL",
        "NEXT_PUBLIC_APP_URL",
      ],
    },
    {
      id: "nakordoni",
      label: "Nakordoni",
      unlocks_bg: "Live опашки на границите",
      configured: hasEnv("NAKORDONI_API_KEY"),
      cost: "free",
      priority: "recommended",
      signup_url: "https://nakordoni.eu/en/developers",
      env_vars: ["NAKORDONI_API_KEY"],
    },
    {
      id: "windy",
      label: "Windy Webcams",
      unlocks_bg: "Вградени webcam изображения на граници",
      configured: hasEnv("WINDY_WEBCAMS_API_KEY"),
      cost: "free",
      priority: "optional",
      signup_url: "https://api.windy.com/webcams",
      env_vars: ["WINDY_WEBCAMS_API_KEY"],
    },
    {
      id: "tomtom",
      label: "TomTom",
      unlocks_bg: "Трафик на картата + бензиностанции",
      configured: hasEnv("TOMTOM_API_KEY"),
      cost: "freemium",
      priority: "optional",
      signup_url: "https://developer.tomtom.com/",
      env_vars: ["TOMTOM_API_KEY"],
    },
    {
      id: "opencharge",
      label: "OpenChargeMap",
      unlocks_bg: "EV зарядни станции",
      configured: hasEnv("OPENCHARGE_API_KEY"),
      cost: "freemium",
      priority: "optional",
      signup_url: "https://openchargemap.org/site/develop",
      env_vars: ["OPENCHARGE_API_KEY"],
    },
    {
      id: "tankerkoenig",
      label: "Tankerkönig",
      unlocks_bg: "Цени на гориво в Германия по плана на пътуването",
      configured: hasEnv("TANKERKOENIG_API_KEY"),
      cost: "free",
      priority: "optional",
      signup_url: "https://creativecommons.tankerkoenig.de/",
      env_vars: ["TANKERKOENIG_API_KEY"],
    },
    {
      id: "nvidia",
      label: "NVIDIA NIM",
      unlocks_bg: "AI план за пътуване (иначе евристика)",
      configured: hasEnv("NVIDIA_API_KEY"),
      cost: "freemium",
      priority: "optional",
      signup_url: "https://build.nvidia.com/",
      env_vars: ["NVIDIA_API_KEY"],
    },
    {
      id: "google",
      label: "Google sign-in",
      unlocks_bg: "Бутон „Продължи с Google“, когато и двата ключа са зададени",
      configured: hasEnv("GOOGLE_CLIENT_ID") && hasEnv("GOOGLE_CLIENT_SECRET"),
      cost: "free",
      priority: "optional",
      signup_url: "https://console.cloud.google.com/apis/credentials",
      env_vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    },
    {
      id: "apple",
      label: "Apple sign-in",
      unlocks_bg: "Бутон „Продължи с Apple“, когато id и тайна са зададени",
      configured: hasEnv("APPLE_CLIENT_ID") && hasEnv("APPLE_CLIENT_SECRET"),
      cost: "paid",
      priority: "optional",
      signup_url:
        "https://developer.apple.com/account/resources/identifiers/list/serviceId",
      env_vars: [
        "APPLE_CLIENT_ID",
        "APPLE_CLIENT_SECRET",
        "APPLE_APP_BUNDLE_IDENTIFIER",
      ],
    },
    {
      id: "app_url",
      label: "Public URL",
      unlocks_bg: "Адрес на приложението за Better Auth и връзките за карти",
      configured: hasEnv("NEXT_PUBLIC_APP_URL"),
      cost: "public",
      priority: "recommended",
      env_vars: ["NEXT_PUBLIC_APP_URL"],
    },
    {
      id: "map_style_custom",
      label: "Custom map style",
      unlocks_bg: "Собствен MapLibre style (иначе Carto Dark Matter)",
      configured: hasEnv("NEXT_PUBLIC_MAP_STYLE_URL"),
      cost: "public",
      priority: "optional",
      env_vars: ["NEXT_PUBLIC_MAP_STYLE_URL"],
    },
    {
      id: "osrm_custom",
      label: "Custom OSRM",
      unlocks_bg: "Production routing (иначе публичен OSRM demo)",
      configured: hasEnv("OSRM_API_URL"),
      cost: "self_host",
      priority: "optional",
      env_vars: ["OSRM_API_URL"],
    },
    {
      id: "geocoding_custom",
      label: "Custom geocoder",
      unlocks_bg: "Production geocoding (иначе Nominatim + кеш)",
      configured: hasEnv("GEOCODING_API_URL"),
      cost: "self_host",
      priority: "optional",
      env_vars: ["GEOCODING_API_URL"],
    },
    {
      id: "oci_geo",
      label: "Valhalla and Photon",
      unlocks_bg: "Маршрути и търсене през собствения сървър; при грешка — публичен OSRM и Nominatim",
      configured: ociGeoEnvState() === "ready",
      cost: "self_host",
      priority: "optional",
      env_vars: ["OCI_GEO_BASE_URL", "OCI_GEO_API_KEY"],
    },
    {
      id: "oci_poi",
      label: "Corridor POI",
      unlocks_bg: "Станции, хотели и почивки по маршрута от собствения POI. Overpass е резерва само с POI_OVERPASS_FALLBACK",
      configured: readPoiConfig() != null,
      cost: "self_host",
      priority: "optional",
      env_vars: ["OCI_POI_BASE_URL", "OCI_GEO_API_KEY"],
    },
    {
      id: "cron_warm",
      label: "Valhalla and Photon warm-up",
      unlocks_bg: "Защитен cron ping, за да не изтича първото търсене след пауза",
      configured: hasEnv("CRON_SECRET"),
      cost: "self_host",
      priority: "optional",
      env_vars: ["CRON_SECRET"],
    },
    {
      id: "fuelo",
      label: "Fuelo country averages",
      unlocks_bg: "Дневни средни цени по държава (само /prices/average, free план)",
      configured: hasEnv("FUELO_API_KEY"),
      cost: "freemium",
      priority: "optional",
      env_vars: ["FUELO_API_KEY"],
    },
  ];
}

export const ACCOUNT_MIGRATION_FILE =
  "drizzle/0001_better_auth_and_community.sql" as const;

export const PLANNER_MIGRATION_FILE =
  "drizzle/0002_trip_planner_cache.sql" as const;

export const PLACES_MIGRATION_FILE =
  "drizzle/0003_planner_places.sql" as const;

export interface ConfigStatusResponse {
  ok: true;
  generated_at: string;
  /** Always-on without keys. */
  works_without_keys: string[];
  services: ServiceStatusItem[];
  database: {
    configured: boolean;
    migration: typeof ACCOUNT_MIGRATION_FILE;
    planner_migration: typeof PLANNER_MIGRATION_FILE;
    places_migration: typeof PLACES_MIGRATION_FILE;
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
      "deterministic_trip_plan",
      "econtrol_fuel_prices",
      "fx_frankfurter",
      "emergency_overpass",
      "tips_hotels_emergency",
    ],
    services,
    database: {
      configured: isDatabaseConfigured(),
      migration: ACCOUNT_MIGRATION_FILE,
      planner_migration: PLANNER_MIGRATION_FILE,
      places_migration: PLACES_MIGRATION_FILE,
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
