import type { Hotspot } from "@/lib/hotspots/types";
import { distanceToPolylineKm } from "@/lib/planner/line";

/** A hotspot farther than this from the driven line stays off the plan. */
export const HOTSPOT_ROUTE_BUFFER_KM = 0.5;

type Line = Array<[number, number]>;

export function hotspotsAlongRoute(
  hotspots: Hotspot[],
  line: Line,
  bufferKm = HOTSPOT_ROUTE_BUFFER_KM
): Hotspot[] {
  if (line.length === 0 || hotspots.length === 0) return [];
  let west = line[0]![0];
  let east = west;
  let south = line[0]![1];
  let north = south;
  for (const point of line) {
    if (point[0] < west) west = point[0];
    if (point[0] > east) east = point[0];
    if (point[1] < south) south = point[1];
    if (point[1] > north) north = point[1];
  }
  const pad = bufferKm / 80;
  const matched: Array<{ hotspot: Hotspot; alongKm: number }> = [];
  for (const hotspot of hotspots) {
    if (
      hotspot.lng < west - pad ||
      hotspot.lng > east + pad ||
      hotspot.lat < south - pad ||
      hotspot.lat > north + pad
    ) {
      continue;
    }
    const approach = distanceToPolylineKm(line, hotspot);
    if (approach.distanceKm <= bufferKm) {
      matched.push({ hotspot, alongKm: approach.alongKm });
    }
  }
  matched.sort((a, b) => a.alongKm - b.alongKm);
  return matched.map((item) => item.hotspot);
}
