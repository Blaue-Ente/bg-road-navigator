/**
 * OSRM routing client — real road distances and geometry
 * @see https://project-osrm.org/
 *
 * Default: public demo server (no API key).
 * Production: set OSRM_API_URL to your own OSRM instance.
 */

export interface OsrmRouteResult {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
}

interface OsrmResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: GeoJSON.LineString;
  }>;
}

const DEFAULT_OSRM_URL = "https://router.project-osrm.org";
const REQUEST_TIMEOUT_MS = 15_000;

function getOsrmBaseUrl(): string {
  return (process.env.OSRM_API_URL ?? DEFAULT_OSRM_URL).replace(/\/$/, "");
}

export function buildOsrmCoordinateString(
  coords: Array<{ lng: number; lat: number }>
): string {
  return coords.map((c) => `${c.lng},${c.lat}`).join(";");
}

export async function fetchOsrmRoute(
  coords: Array<{ lng: number; lat: number }>
): Promise<OsrmRouteResult | null> {
  if (coords.length < 2) return null;

  const coordinateString = buildOsrmCoordinateString(coords);
  const url = `${getOsrmBaseUrl()}/route/v1/driving/${coordinateString}?overview=full&geometries=geojson&steps=false`;

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
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) return null;

    return {
      distance_km: Math.round(route.distance / 1000),
      duration_min: Math.round(route.duration / 60),
      geometry: route.geometry,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
