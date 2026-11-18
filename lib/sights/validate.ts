import type { AiSight } from "@/lib/ai/sights";
import { projectOnLine } from "@/lib/sights/geometry";
import type { PlanSight } from "@/lib/sights/types";

/** A sight farther than this from the road is not worth the detour. */
export const MAX_OFF_ROUTE_KM = 25;
/** A planned rest this close along the road could become the sight stop. */
const REST_MATCH_KM = 25;
const DETOUR_SPEED_KMH = 45;

export interface FoundPlace {
  lat: number;
  lng: number;
}

/**
 * Keeps only the sights the map can place near the road, with real distances.
 * `find` answers the coordinates of "name, town" or null when the map does not
 * know it, which is how an invented place is dropped.
 */
export async function placeSights(
  suggestions: AiSight[],
  line: Array<[number, number]>,
  totalKm: number,
  restKm: number[],
  find: (name: string, town: string) => Promise<FoundPlace | null>
): Promise<PlanSight[]> {
  const found = await Promise.all(
    suggestions.map(async (sight) => ({
      sight,
      place: await find(sight.name, sight.town).catch(() => null),
    }))
  );
  const out: PlanSight[] = [];
  const seen = new Set<string>();
  for (const { sight, place } of found) {
    if (!place) continue;
    const position = projectOnLine(line, place, totalKm);
    if (!position || position.offKm > MAX_OFF_ROUTE_KM) continue;
    const key = `${place.lat.toFixed(2)},${place.lng.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const detourMin = Math.round(((2 * position.offKm) / DETOUR_SPEED_KMH) * 60);
    const nearRest = restKm
      .map((km) => ({ km, gap: Math.abs(km - position.alongKm) }))
      .filter((row) => row.gap <= REST_MATCH_KM)
      .sort((a, b) => a.gap - b.gap)[0];
    out.push({
      id: `sight-${out.length + 1}-${key}`,
      name: sight.name,
      town: sight.town,
      kind: sight.kind,
      lat: place.lat,
      lng: place.lng,
      along_km: position.alongKm,
      off_route_km: position.offKm,
      visit_min: sight.visit_min,
      extra_min: sight.visit_min + detourMin,
      why: sight.why,
      history: sight.history,
      near_rest_km: nearRest?.km ?? null,
      family_friendly: sight.family_friendly,
    });
  }
  return out.sort((a, b) => a.along_km - b.along_km).slice(0, 8);
}
