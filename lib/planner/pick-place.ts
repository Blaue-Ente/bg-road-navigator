import { compareFuelStops } from "@/lib/fuel-prices/bands";
import { distanceToPolylineKm, lineLengthKm } from "@/lib/planner/line";
import { flagBias } from "@/lib/planner/flag-score";
import {
  detourLimitKm,
  placePreferenceScore,
  type TripPreferences,
} from "@/lib/planner/preferences";
import type { CorridorPlace } from "@/lib/poi/types";
import { GENERIC_PLACE_NAMES_BG } from "@/lib/i18n/locales/pick-place-generic";

const GENERIC = new Set([...GENERIC_PLACE_NAMES_BG, "fuel", "hotel"]);

export interface AnnotatedPlace extends CorridorPlace {
  alongKm: number;
  detourKm: number;
  priceAmount: number | null;
  /** National average used to colour this station. Null when the bulletin has no row. */
  nationalAvgPerL: number | null;
  priceBasis: "official" | "community" | null;
  priceSource: "e-control" | "tankerkoenig" | "nakordoni" | "community" | null;
  observedAt: string | null;
  savingsEur: number | null;
  flagWeights?: Record<string, number>;
}

export function annotatePlaces(
  line: Array<[number, number]>,
  roadKm: number,
  places: CorridorPlace[]
): AnnotatedPlace[] {
  const geometryKm = Math.max(1, lineLengthKm(line));
  const scale = roadKm > 0 ? roadKm / geometryKm : 1;
  return places.map((place) => {
    const along = distanceToPolylineKm(line, {
      lng: place.lng,
      lat: place.lat,
    });
    return {
      ...place,
      alongKm:
        place.alongM == null
          ? along.alongKm * scale
          : (place.alongM / 1000) * scale,
      detourKm: place.distM == null ? along.distanceKm : place.distM / 1000,
      priceAmount: null,
      nationalAvgPerL: null,
      priceBasis: null,
      priceSource: null,
      observedAt: null,
      savingsEur: null,
    };
  });
}

/** Depots for lorries only (fuel-card networks); a car cannot always use them. */
const TRUCK_ONLY = /eurowag|truck\s*stop|truckstop|\blkw\b|tir\s*park/i;

export function isTruckOnlyStation(place: { name: string; brand?: string | null }): boolean {
  return TRUCK_ONLY.test(`${place.name} ${place.brand ?? ""}`);
}

export function isNamedPlace(place: { name: string }): boolean {
  const name = place.name.trim().toLocaleLowerCase("bg-BG");
  return name.length >= 2 && !GENERIC.has(name);
}

export function pickPlace(
  places: AnnotatedPlace[],
  prefs: TripPreferences,
  options: {
    kinds: string[];
    windowStartKm: number;
    windowEndKm: number;
    looseDetourKm?: number;
  }
): AnnotatedPlace | null {
  const limit = options.looseDetourKm ?? detourLimitKm(prefs);
  const ranked = places
    .filter((place) => options.kinds.includes(place.kind))
    .filter((place) => place.kind !== "fuel" || !isTruckOnlyStation(place))
    .filter(
      (place) =>
        place.alongKm >= options.windowStartKm - 8 &&
        place.alongKm <= options.windowEndKm + 8
    )
    .filter((place) => place.detourKm <= limit)
    .map((place) => ({ place, score: scorePlace(place, prefs) }));
  const fuelOnly =
    options.kinds.length > 0 && options.kinds.every((kind) => kind === "fuel");
  ranked.sort((a, b) => {
    let cmp = fuelOnly
      ? compareFuelStops(a.place, a.score, b.place, b.score)
      : b.score - a.score;
    if (cmp === 0) cmp = a.place.id.localeCompare(b.place.id);
    return cmp;
  });
  return ranked[0]?.place ?? null;
}

export function pickSights(
  places: AnnotatedPlace[],
  prefs: TripPreferences,
  takenKm: number[],
  driveMin: number,
  distanceKm: number
): AnnotatedPlace[] {
  if (prefs.pace !== "scenic" || distanceKm <= 0) return [];
  const chosen: AnnotatedPlace[] = [];
  const ranked = places
    .filter(
      (place) => place.kind === "attraction" || place.kind === "viewpoint"
    )
    .filter((place) => isNamedPlace(place) && place.detourKm <= 8)
    .sort((a, b) => scorePlace(b, prefs) - scorePlace(a, prefs));
  for (const place of ranked) {
    const minute = (place.alongKm / distanceKm) * driveMin;
    if (minute < 20 || minute > driveMin - 20) continue;
    const crowded = [...takenKm, ...chosen.map((item) => item.alongKm)].some(
      (km) => Math.abs(km - place.alongKm) < 40
    );
    if (crowded) continue;
    chosen.push(place);
    if (chosen.length >= 2) break;
  }
  return chosen;
}

function scorePlace(place: AnnotatedPlace, prefs: TripPreferences): number {
  let score = placePreferenceScore(place, prefs);
  score += flagBias(place.flagWeights, prefs);
  if (isNamedPlace(place)) score += 6;
  if (place.priceAmount != null) score += 1;
  if (place.savingsEur != null) score += place.savingsEur * 4;
  score -= place.detourKm;
  return score;
}
