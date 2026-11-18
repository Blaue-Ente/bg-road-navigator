import type { AnnotatedPlace } from "@/lib/planner/pick-place";

/** Fast-food chains families look for on the road. Matched on brand, then name. */
const CHAINS: Array<{ label: string; test: RegExp }> = [
  { label: "McDonald's", test: /mc\s?donald|\u043c\u0430\u043a\u0434\u043e\u043d\u0430\u043b\u0434/i },
  { label: "KFC", test: /\bkfc\b|kentucky/i },
  { label: "Burger King", test: /burger\s?king|\u0431\u0443\u0440\u0433\u044a\u0440\s?\u043a\u0438\u043d\u0433/i },
  { label: "Hesburger", test: /hesburger/i },
  { label: "Subway", test: /\bsubway\b/i },
  { label: "Pizza Hut", test: /pizza\s?hut/i },
  { label: "Domino's", test: /domino/i },
  { label: "Popeyes", test: /popeyes/i },
];

export interface FoodSpotDraft {
  id: string;
  chain: string;
  name: string;
  lat: number;
  lng: number;
  alongKm: number;
  /** Driving minutes from the start, before stops and sleep. */
  etaMin: number;
  detourKm: number;
}

export function chainOf(place: { brand: string | null; name: string }): string | null {
  const text = `${place.brand ?? ""} ${place.name}`;
  return CHAINS.find((chain) => chain.test.test(text))?.label ?? null;
}

/**
 * Chain restaurants close to the road, thinned so two are never closer than
 * `minGapKm`: enough to say "a McDonald's about two hours in" without a list
 * of every one.
 */
export function foodChainSpots(
  places: AnnotatedPlace[],
  input: {
    distanceKm: number;
    driveMin: number;
    maxDetourKm?: number;
    minGapKm?: number;
    max?: number;
  }
): FoodSpotDraft[] {
  const maxDetour = input.maxDetourKm ?? 3;
  const minGap = input.minGapKm ?? 35;
  const max = input.max ?? 12;
  const candidates = places
    .filter((place) => place.kind === "restaurant" && place.detourKm <= maxDetour)
    .map((place) => ({ place, chain: chainOf(place) }))
    .filter(
      (row): row is { place: AnnotatedPlace; chain: string } => row.chain !== null
    )
    .sort((a, b) => a.place.alongKm - b.place.alongKm);

  const out: FoodSpotDraft[] = [];
  for (const { place, chain } of candidates) {
    const last = out[out.length - 1];
    if (last && place.alongKm - last.alongKm < minGap) continue;
    out.push({
      id: place.id,
      chain,
      name: place.name || chain,
      lat: place.lat,
      lng: place.lng,
      alongKm: Math.round(place.alongKm),
      etaMin:
        input.distanceKm <= 0
          ? 0
          : (place.alongKm / input.distanceKm) * input.driveMin,
      detourKm: Math.round(place.detourKm * 10) / 10,
    });
    if (out.length >= max) break;
  }
  return out;
}
