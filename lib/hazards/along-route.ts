import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import type { RoadHazard } from "@/lib/hazards/types";
import { distanceToPolylineKm } from "@/lib/planner/line";

/** About 300 m. Situations farther from the Bulgarian vertices stay off the plan. */
export const HAZARD_BUFFER_KM = 0.3;

type Line = Array<[number, number]>;

/**
 * Contiguous runs of vertices that fall inside Bulgaria.
 * A vertex abroad ends the run, so a hazard near Munich is not matched
 * against the Sofia–Plovdiv chord of the same line.
 */
export function bulgarianSegments(
  line: Line,
  countryAt: (lng: number, lat: number) => string | null = countryCodeAtPoint
): Line[] {
  const segments: Line[] = [];
  let current: Line = [];
  for (const point of line) {
    if (countryAt(point[0], point[1]) === "BG") {
      current.push(point);
      continue;
    }
    if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

export function hazardsAlongRoute(
  hazards: RoadHazard[],
  line: Line,
  countryAt: (lng: number, lat: number) => string | null = countryCodeAtPoint
): RoadHazard[] {
  const segments = bulgarianSegments(line, countryAt);
  if (segments.length === 0) return [];
  return hazards.filter((hazard) =>
    segments.some(
      (segment) =>
        distanceToPolylineKm(segment, { lng: hazard.lng, lat: hazard.lat })
          .distanceKm <= HAZARD_BUFFER_KM
    )
  );
}
