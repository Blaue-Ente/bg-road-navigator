import type { GeoPoint, Route } from "@/types/route.types";

/** Google Maps URLs accept at most 9 waypoints (origin and destination extra). */
export const GOOGLE_MAPS_MAX_WAYPOINTS = 9;
/** Mobile web Google Maps keeps fewer waypoints before it drops the rest. */
export const GOOGLE_MAPS_MOBILE_MAX_WAYPOINTS = 3;
/** Shared cap for Google and Apple directions URLs. */
export const MAPS_URL_MAX_LENGTH = 2048;

export interface MapStop {
  lat: number;
  lng: number;
  label?: string;
}

export interface MapsHandoffLeg {
  origin: MapStop;
  destination: MapStop;
  waypoints: MapStop[];
  googleUrl: string;
  /** Unified maps.apple.com/directions URL, including waypoints. */
  appleUrl: string;
  /**
   * Legacy maps.apple.com/?saddr=&daddr= link for the same leg.
   * Waypoints are not repeated here; older clients only honour the endpoints.
   */
  appleLegacyUrl: string;
  /** Waze can open a single destination, so this is the leg destination. */
  wazeUrl: string;
}

export interface WazeStopLink {
  label?: string;
  url: string;
}

export interface MapsHandoffPlan {
  legs: MapsHandoffLeg[];
  /** Every stop after the origin, for "next stop" and per-leg Waze links. */
  wazeStops: WazeStopLink[];
}

export interface MapsHandoffOptions {
  maxWaypoints?: number;
  maxUrlLength?: number;
}

function formatCoord(value: number): string {
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded);
}

function formatLatLng(point: GeoPoint): string {
  return `${formatCoord(point.lat)},${formatCoord(point.lng)}`;
}

/** Build a Google Maps directions URL. Waypoints keep the planned stop order. */
export function googleMapsDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint,
  waypoints: GeoPoint[] = []
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: formatLatLng(origin),
    destination: formatLatLng(destination),
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.map(formatLatLng).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Current Apple Maps directions URL (maps.apple.com/directions).
 * Waypoints are repeated `waypoint` parameters between source and destination.
 */
export function appleMapsDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint,
  waypoints: GeoPoint[] = []
): string {
  const params = new URLSearchParams();
  params.set("source", formatLatLng(origin));
  for (const waypoint of waypoints) {
    params.append("waypoint", formatLatLng(waypoint));
  }
  params.set("destination", formatLatLng(destination));
  params.set("mode", "driving");
  return `https://maps.apple.com/directions?${params.toString()}`;
}

/** Legacy Apple Maps URL. Fallback when /directions is not understood. */
export function appleMapsLegacyDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint
): string {
  const params = new URLSearchParams({
    saddr: formatLatLng(origin),
    daddr: formatLatLng(destination),
    dirflg: "d",
  });
  return `https://maps.apple.com/?${params.toString()}`;
}

/** Waze deep link. One destination; `ll` is latitude,longitude. */
export function wazeNavigateUrl(point: GeoPoint): string {
  return `https://waze.com/ul?ll=${formatLatLng(point)}&navigate=yes`;
}

function dedupeStops(stops: MapStop[]): MapStop[] {
  const out: MapStop[] = [];
  for (const stop of stops) {
    if (!Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) continue;
    const prev = out[out.length - 1];
    if (
      prev &&
      Math.abs(prev.lat - stop.lat) < 1e-5 &&
      Math.abs(prev.lng - stop.lng) < 1e-5
    ) {
      continue;
    }
    out.push(stop);
  }
  return out;
}

export function stopsFromRoute(
  route: Pick<Route, "origin" | "destination" | "waypoints">
): MapStop[] {
  return [
    {
      lat: route.origin.coords.lat,
      lng: route.origin.coords.lng,
      label: route.origin.label,
    },
    ...route.waypoints.map((stop) => ({
      lat: stop.coords.lat,
      lng: stop.coords.lng,
      label: stop.label,
    })),
    {
      lat: route.destination.coords.lat,
      lng: route.destination.coords.lng,
      label: route.destination.label,
    },
  ];
}

/**
 * Split a trip into directions legs that respect waypoint and URL limits.
 * `stops[0]` is the origin and the last stop is the final destination.
 */
export function buildMapsHandoff(
  stops: MapStop[],
  options?: MapsHandoffOptions
): MapsHandoffPlan {
  const maxWaypoints = options?.maxWaypoints ?? GOOGLE_MAPS_MAX_WAYPOINTS;
  const maxUrlLength = options?.maxUrlLength ?? MAPS_URL_MAX_LENGTH;
  const points = dedupeStops(stops);
  if (points.length < 2) return { legs: [], wazeStops: [] };

  const legs: MapsHandoffLeg[] = [];
  let start = 0;
  while (start < points.length - 1) {
    const maxEnd = Math.min(points.length - 1, start + 1 + maxWaypoints);
    let end = start + 1;
    for (let candidate = start + 1; candidate <= maxEnd; candidate++) {
      const origin = points[start]!;
      const destination = points[candidate]!;
      const waypoints = points.slice(start + 1, candidate);
      const googleUrl = googleMapsDirectionsUrl(origin, destination, waypoints);
      const appleUrl = appleMapsDirectionsUrl(origin, destination, waypoints);
      const fits =
        googleUrl.length <= maxUrlLength && appleUrl.length <= maxUrlLength;
      if (!fits && candidate > start + 1) break;
      end = candidate;
      if (!fits) break;
    }

    const origin = points[start]!;
    const destination = points[end]!;
    const waypoints = points.slice(start + 1, end);
    legs.push({
      origin,
      destination,
      waypoints,
      googleUrl: googleMapsDirectionsUrl(origin, destination, waypoints),
      appleUrl: appleMapsDirectionsUrl(origin, destination, waypoints),
      appleLegacyUrl: appleMapsLegacyDirectionsUrl(origin, destination),
      wazeUrl: wazeNavigateUrl(destination),
    });
    start = end;
  }

  return {
    legs,
    wazeStops: points.slice(1).map((stop) => ({
      label: stop.label,
      url: wazeNavigateUrl(stop),
    })),
  };
}
