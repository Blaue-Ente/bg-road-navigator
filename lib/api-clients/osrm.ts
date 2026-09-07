/**
 * OSRM routing client — real road distances, geometry, and step list.
 * Default: public demo server (no API key).
 * Production: set OSRM_API_URL to your own OSRM instance.
 */

import { stepsToManeuvers } from "@/lib/utils/maneuvers";
import type { RouteManeuver } from "@/types/route.types";

export interface OsrmRouteResult {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  maneuvers: RouteManeuver[];
  alternatives: Array<{
    distance_km: number;
    duration_min: number;
    geometry: GeoJSON.LineString;
    weight: number;
    maneuvers: RouteManeuver[];
  }>;
}

interface OsrmStep {
  name?: string;
  distance?: number;
  duration?: number;
  maneuver?: {
    type?: string;
    modifier?: string;
    location?: [number, number];
    exit?: number;
  };
}

interface OsrmResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    weight?: number;
    geometry: GeoJSON.LineString;
    legs?: Array<{ steps?: OsrmStep[] }>;
  }>;
}

const DEFAULT_OSRM_URL = "https://router.project-osrm.org";
const REQUEST_TIMEOUT_MS = 15_000;

function getOsrmBaseUrl(): string {
  return (process.env.OSRM_API_URL ?? DEFAULT_OSRM_URL).replace(/\/$/, "");
}

function flattenSteps(
  legs: Array<{ steps?: OsrmStep[] }> | undefined
): OsrmStep[] {
  return (legs ?? []).flatMap((leg) => leg.steps ?? []);
}

export function buildOsrmCoordinateString(
  coords: Array<{ lng: number; lat: number }>
): string {
  return coords.map((c) => `${c.lng},${c.lat}`).join(";");
}

export async function fetchOsrmRoute(
  coords: Array<{ lng: number; lat: number }>,
  options?: { alternatives?: boolean }
): Promise<OsrmRouteResult | null> {
  if (coords.length < 2) return null;

  const coordinateString = buildOsrmCoordinateString(coords);
  const wantAlts = options?.alternatives ?? true;
  const url =
    `${getOsrmBaseUrl()}/route/v1/driving/${coordinateString}` +
    `?overview=full&geometries=geojson&steps=true` +
    (wantAlts ? "&alternatives=true" : "");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as OsrmResponse;
    const routes = data.routes ?? [];
    const primary = routes[0];
    if (data.code !== "Ok" || !primary) return null;

    const alternatives = routes.slice(1, 4).map((route, index) => ({
      distance_km: Math.round(route.distance / 1000),
      duration_min: Math.round(route.duration / 60),
      geometry: route.geometry,
      weight: route.weight ?? index + 1,
      maneuvers: stepsToManeuvers(flattenSteps(route.legs)),
    }));

    return {
      distance_km: Math.round(primary.distance / 1000),
      duration_min: Math.round(primary.duration / 60),
      geometry: primary.geometry,
      maneuvers: stepsToManeuvers(flattenSteps(primary.legs)),
      alternatives,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
