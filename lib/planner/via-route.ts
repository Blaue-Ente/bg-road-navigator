import {
  failureFromError,
  failureFromStatus,
  ociFetch,
  readOciGeoConfig,
  VALHALLA_TIMEOUT_MS,
} from "@/lib/api-clients/oci-geo";
import { fetchOsrmRoute } from "@/lib/api-clients/osrm";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";
import {
  buildValhallaRouteBody,
  mapValhallaResponse,
  type ValhallaCosting,
} from "@/lib/api-clients/valhalla";
import { fetchDrivingRoute } from "@/lib/api-clients/routing";
import { chooseScenicRoute } from "@/lib/planner/scenic";

export interface ThroughPoint {
  lng: number;
  lat: number;
  role: "break" | "through";
}

/**
 * On an "interesting" pace the fast and the scenic road are both asked for and
 * `chooseScenicRoute` decides. Without Valhalla only the fast road exists.
 */
export async function withScenic(
  scenicPace: boolean,
  fetcher: (costing?: ValhallaCosting) => Promise<ProvidedRoadRoute | null>,
  costing?: ValhallaCosting
): Promise<ProvidedRoadRoute | null> {
  if (!scenicPace) return fetcher(costing);
  if (!readOciGeoConfig()) {
    return chooseScenicRoute(await fetcher(costing), null);
  }
  const [fast, scenic] = await Promise.all([
    fetcher(costing),
    fetcher({ ...costing, scenic: true }),
  ]);
  // A route the engine answered with OSRM is not a scenic road at all.
  return chooseScenicRoute(fast, scenic?.provider === "valhalla" ? scenic : null);
}

/** Direct driving route: Valhalla when configured, otherwise OSRM. */
export async function fetchDirectRoute(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
  costing?: ValhallaCosting
): Promise<ProvidedRoadRoute | null> {
  return fetchDrivingRoute([origin, destination], costing);
}

/**
 * Route that must pass a border. Valhalla gets a through-point.
 * If that body is rejected, the same points are sent as breaks, then OSRM.
 */
export async function fetchRouteThrough(
  points: ThroughPoint[],
  costing?: ValhallaCosting
): Promise<ProvidedRoadRoute | null> {
  if (points.length < 2) return null;
  const config = readOciGeoConfig();
  if (config) {
    const through = await postValhalla(
      points,
      config.baseUrl,
      config.apiKey,
      costing
    );
    if (through) return { provider: "valhalla", ...through };
    const asBreaks = points.map((point) => ({
      ...point,
      role: "break" as const,
    }));
    const broken = await postValhalla(
      asBreaks,
      config.baseUrl,
      config.apiKey,
      costing
    );
    if (broken) return { provider: "valhalla", ...broken };
  }
  const osrm = await fetchOsrmRoute(
    points.map((point) => ({ lng: point.lng, lat: point.lat })),
    { alternatives: false }
  );
  if (!osrm) return null;
  return { provider: "osrm", ...osrm };
}

async function postValhalla(
  points: ThroughPoint[],
  baseUrl: string,
  apiKey: string,
  costing?: ValhallaCosting
) {
  const url = `${baseUrl}/valhalla/route`;
  try {
    const response = await ociFetch(
      url,
      apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildValhallaRouteBody(
            points.map((point) => ({
              lng: point.lng,
              lat: point.lat,
              type: point.role,
            })),
            costing
          )
        ),
        next: { revalidate: 0 },
      },
      VALHALLA_TIMEOUT_MS
    );
    if (!response.ok || response.status >= 300) {
      failureFromStatus(response.status);
      return null;
    }
    return mapValhallaResponse(await response.json());
  } catch (error) {
    failureFromError(error);
    return null;
  }
}
