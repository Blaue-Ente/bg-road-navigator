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

export interface ProvidedRoadRoute extends RoadRoute {
  provider: RoadRouter;
}
