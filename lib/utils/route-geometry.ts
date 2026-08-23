import type { Route } from "@/types/route.types";

/** Keep start/end and evenly spaced vertices so long OSRM traces stay usable. */
export function downsampleLineString(
  coordinates: Array<[number, number]>,
  maxPoints = 1500
): Array<[number, number]> {
  if (coordinates.length <= maxPoints) return coordinates;

  const result: Array<[number, number]> = [];
  const last = coordinates.length - 1;
  const step = last / (maxPoints - 1);

  for (let index = 0; index < maxPoints - 1; index++) {
    result.push(coordinates[Math.round(index * step)]!);
  }
  result.push(coordinates[last]!);
  return result;
}

export function compactRouteForPlanning(
  route: Route,
  maxPoints = 1500
): Route {
  return {
    ...route,
    alternatives: [],
    geometry: {
      ...route.geometry,
      coordinates: downsampleLineString(
        route.geometry.coordinates as [number, number][],
        maxPoints
      ),
    },
  };
}
