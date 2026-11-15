import type { TripPreferences } from "@/lib/planner/preferences";

/** Recent flags count more. About half the weight remains after three weeks. */
const DECAY_DAYS = 21;

const PENALTY: Record<string, number> = {
  unsafe: -4,
  dirty: -3,
  crowded: -2,
  expensive: -1.5,
  slow_service: -1,
  bad_coffee: -0.5,
  paid_toilets: -0.4,
};

const BOOST: Record<string, number> = {
  cheap: 2,
  clean: 2,
  fast_service: 1,
  good_coffee: 0.6,
  free_toilets: 0.5,
  safe_parking: 1,
  pet_friendly: 2.5,
  kid_friendly: 2,
};

export const PLACE_FLAG_VALUES = [
  "cheap",
  "expensive",
  "dirty",
  "clean",
  "crowded",
  "paid_toilets",
  "free_toilets",
  "bad_coffee",
  "good_coffee",
  "slow_service",
  "fast_service",
  "pet_friendly",
  "kid_friendly",
  "safe_parking",
  "unsafe",
] as const;

export type PlaceFlagValue = (typeof PLACE_FLAG_VALUES)[number];

export const PLACE_FLAG_KINDS = [
  "fuel",
  "rest",
  "hotel",
  "restaurant",
] as const;

export type PlaceFlagKind = (typeof PLACE_FLAG_KINDS)[number];

export interface FlagSighting {
  placeId: string;
  flag: string;
  createdAt: Date;
}

export interface AggregatedFlags {
  weights: Record<string, number>;
  top: string[];
}

export function flagWeight(createdAt: Date, now: Date): number {
  const days = (now.getTime() - createdAt.getTime()) / 86_400_000;
  if (!Number.isFinite(days) || days <= 0) return 1;
  return Math.exp(-days / DECAY_DAYS);
}

export function aggregateFlags(
  rows: FlagSighting[],
  now: Date
): Map<string, AggregatedFlags> {
  const grouped = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const weight = flagWeight(row.createdAt, now);
    const current = grouped.get(row.placeId) ?? {};
    current[row.flag] = (current[row.flag] ?? 0) + weight;
    grouped.set(row.placeId, current);
  }
  const result = new Map<string, AggregatedFlags>();
  for (const [placeId, weights] of grouped) {
    const rounded: Record<string, number> = {};
    for (const [flag, weight] of Object.entries(weights)) {
      rounded[flag] = Math.round(weight * 100) / 100;
    }
    const top = Object.entries(rounded)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([flag]) => flag);
    result.set(placeId, { weights: rounded, top });
  }
  return result;
}

export function flagBias(
  weights: Record<string, number> | undefined,
  prefs: Pick<TripPreferences, "with_pet" | "with_children">
): number {
  if (!weights) return 0;
  let score = 0;
  for (const [flag, weight] of Object.entries(weights)) {
    if (flag === "pet_friendly" && !prefs.with_pet) continue;
    if (flag === "kid_friendly" && !prefs.with_children) continue;
    const coefficient = PENALTY[flag] ?? BOOST[flag] ?? 0;
    score += coefficient * weight;
  }
  return Math.round(score * 100) / 100;
}
