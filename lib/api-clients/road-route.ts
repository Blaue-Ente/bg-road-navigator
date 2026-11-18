import type { RouteManeuver } from "@/types/route.types";

/** One drivable path: the shape already used by the map, tolls, and maneuver list. */
export interface RoadRoute {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  maneuvers: RouteManeuver[];
  alternatives: RoadRouteAlternative[];
}

export interface RoadRouteAlternative {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  weight: number;
  maneuvers: RouteManeuver[];
}

export type RoadRouter = "valhalla" | "osrm";

/** What the "interesting road" request did to this route. */
export interface ScenicInfo {
  /** The route drawn is the scenic one. */
  applied: boolean;
  /** Why it was or was not used. */
  reason: "applied" | "same" | "too_long" | "unsupported";
  /** The scenic road against the fast one; null when it was not computed. */
  extra_km: number | null;
  extra_min: number | null;
}

export interface ProvidedRoadRoute extends RoadRoute {
  provider: RoadRouter;
  scenic?: ScenicInfo;
}
