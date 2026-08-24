import type { GeoPoint } from "@/types/route.types";

/** Google Maps URL API allows up to 9 waypoints; keep a few for Apple too. */
export const MAX_HANDOFF_WAYPOINTS = 8;
const MAX_APPLE_VIA_POINTS = 4;

export function sampleHandoffWaypoints(
  geometry: GeoJSON.LineString | undefined | null,
  maxWaypoints = MAX_HANDOFF_WAYPOINTS
): GeoPoint[] {
  const coordinates = geometry?.coordinates;
  if (!coordinates || coordinates.length < 4 || maxWaypoints < 1) {
    return [];
  }

  const inner = coordinates.slice(1, -1);
  const picked: Array<[number, number]> = [];

  if (inner.length <= maxWaypoints) {
    for (const coord of inner) {
      picked.push([Number(coord[0]), Number(coord[1])]);
    }
  } else {
    const last = inner.length - 1;
    const step = last / (maxWaypoints - 1);
    for (let index = 0; index < maxWaypoints; index++) {
      const point = inner[Math.round(index * step)]!;
      picked.push([Number(point[0]), Number(point[1])]);
    }
  }

  const waypoints: GeoPoint[] = [];
  for (const [lng, lat] of picked) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const previous = waypoints[waypoints.length - 1];
    if (previous && previous.lng === lng && previous.lat === lat) continue;
    waypoints.push({ lng, lat });
  }
  return waypoints;
}

function coordParam(point: GeoPoint): string {
  return `${point.lat},${point.lng}`;
}

/** Build Google Maps directions URL (web + Android intent-friendly). */
export function googleMapsDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint,
  waypoints: GeoPoint[] = []
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: coordParam(origin),
    destination: coordParam(destination),
    travelmode: "driving",
    dir_action: "navigate",
  });
  if (waypoints.length > 0) {
    params.set(
      "waypoints",
      waypoints.slice(0, MAX_HANDOFF_WAYPOINTS).map(coordParam).join("|")
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Build Apple Maps directions URL, with via points when we have a geometry. */
export function appleMapsDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint,
  waypoints: GeoPoint[] = []
): string {
  const params = new URLSearchParams({
    saddr: coordParam(origin),
    dirflg: "d",
  });
  const hops = [...waypoints.slice(0, MAX_APPLE_VIA_POINTS), destination];
  for (const hop of hops) {
    params.append("daddr", coordParam(hop));
  }
  return `https://maps.apple.com/?${params.toString()}`;
}

/**
 * Waze deep link. Waze does not accept a full path — only origin and destination,
 * then it recalculates live traffic on its own network.
 */
export function wazeDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint
): string {
  const params = new URLSearchParams({
    ll: coordParam(destination),
    from: coordParam(origin),
    navigate: "yes",
  });
  return `https://www.waze.com/ul?${params.toString()}`;
}

export function mapsHandoffUrls(
  origin: GeoPoint,
  destination: GeoPoint,
  geometry?: GeoJSON.LineString | null
) {
  const waypoints = sampleHandoffWaypoints(geometry);
  return {
    google: googleMapsDirectionsUrl(origin, destination, waypoints),
    apple: appleMapsDirectionsUrl(origin, destination, waypoints),
    waze: wazeDirectionsUrl(origin, destination),
    waypointCount: waypoints.length,
  };
}
