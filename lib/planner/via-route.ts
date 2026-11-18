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

/**
 * Fast road for most of the trip and the scenic one only for the last share of
 * it (for example the last 40%). Both parts come from one split point on the
 * fast road; the answer goes through the same cap as a whole scenic road.
 * Direct trips only: with via points the whole-trip choice is used.
 */
export async function withScenicLastLeg(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
  costing: ValhallaCosting | undefined,
  lastShare: number
): Promise<ProvidedRoadRoute | null> {
  const fast = await fetchDirectRoute(origin, destination, costing);
  if (!fast) return null;
  if (!readOciGeoConfig()) return chooseScenicRoute(fast, null);
  const line = fast.geometry.coordinates as Array<[number, number]>;
  const split = splitAt(line, 1 - lastShare);
  if (!split) return chooseScenicRoute(fast, null);
  const leg = await fetchDirectRoute(
    { lng: split.point[0], lat: split.point[1] },
    destination,
    { ...costing, scenic: true }
  );
  if (!leg || leg.provider !== "valhalla") return chooseScenicRoute(fast, null);
  const combined: ProvidedRoadRoute = {
    provider: "valhalla",
    distance_km: fast.distance_km * split.share + leg.distance_km,
    duration_min: fast.duration_min * split.share + leg.duration_min,
    geometry: {
      type: "LineString",
      coordinates: [...line.slice(0, split.index + 1), ...leg.geometry.coordinates.slice(1)],
    },
    maneuvers: [],
    alternatives: [],
  };
  return chooseScenicRoute(fast, combined);
}

/** The point at a share of the line's length, and the index just before it. */
function splitAt(
  line: Array<[number, number]>,
  share: number
): { index: number; point: [number, number]; share: number } | null {
  if (line.length < 3 || share <= 0.05 || share >= 0.95) return null;
  const lengths = [0];
  for (let i = 1; i < line.length; i += 1) {
    const dx = (line[i]![0] - line[i - 1]![0]) * Math.cos((line[i]![1] * Math.PI) / 180);
    const dy = line[i]![1] - line[i - 1]![1];
    lengths.push(lengths[i - 1]! + Math.hypot(dx, dy));
  }
  const total = lengths[lengths.length - 1]!;
  if (total <= 0) return null;
  const target = total * share;
  let index = 0;
  while (index < line.length - 2 && lengths[index + 1]! < target) index += 1;
  return { index, point: line[index]!, share: lengths[index]! / total };
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
