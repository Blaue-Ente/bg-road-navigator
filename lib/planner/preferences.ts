import { z } from "zod";

export const TripPreferencePatchSchema = z.object({
  fuel_stop: z.enum(["on_route", "detour"]).optional(),
  max_detour_min: z.number().int().min(0).max(45).optional(),
  break_every_min: z.number().int().min(45).max(240).optional(),
  with_pet: z.boolean().optional(),
  avoid_motorways: z.boolean().optional(),
  avoid_tolls: z.boolean().optional(),
  overnight: z.boolean().optional(),
  max_driving_hours: z.number().min(4).max(14).optional(),
  pace: z.enum(["fast", "scenic"]).optional(),
  with_children: z.boolean().optional(),
  children_ages: z.array(z.number().int().min(0).max(17)).max(8).optional(),
  drivers: z.number().int().min(1).max(4).optional(),
  depart_at: z.string().datetime().nullable().optional(),
  avoid_borders: z.array(z.string().trim().min(1).max(64)).max(12).optional(),
  preferred_border: z.string().trim().min(1).max(64).nullable().optional(),
});

export type TripPreferencePatch = z.infer<typeof TripPreferencePatchSchema>;

export interface TripPreferences {
  fuel_stop: "on_route" | "detour";
  max_detour_min: number;
  break_every_min: number;
  with_pet: boolean;
  avoid_motorways: boolean;
  avoid_tolls: boolean;
  overnight: boolean;
  max_driving_hours: number;
  pace: "fast" | "scenic";
  with_children: boolean;
  children_ages: number[];
  drivers: number;
  depart_at: string | null;
  avoid_borders: string[];
  preferred_border: string | null;
}

export const DEFAULT_TRIP_PREFERENCES: TripPreferences = {
  fuel_stop: "detour",
  max_detour_min: 8,
  break_every_min: 135,
  with_pet: false,
  avoid_motorways: false,
  avoid_tolls: false,
  overnight: true,
  max_driving_hours: 10.5,
  pace: "fast",
  with_children: false,
  children_ages: [],
  drivers: 1,
  depart_at: null,
  avoid_borders: [],
  preferred_border: null,
};

export interface ValhallaCosting {
  useHighways: boolean;
  useTolls: boolean;
}

export interface DrivingDayLimits {
  overnight: boolean;
  overnightAfterMin: number;
  overnightAtMin: number;
}

function defined<T extends object>(value: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) (out as Record<string, unknown>)[key] = item;
  }
  return out;
}

export function resolveTripPreferences(
  overrides?: unknown,
  stored?: unknown
): TripPreferences {
  const fromStored = TripPreferencePatchSchema.safeParse(stored ?? {});
  const fromOverrides = TripPreferencePatchSchema.safeParse(overrides ?? {});
  return {
    ...DEFAULT_TRIP_PREFERENCES,
    ...(fromStored.success ? defined(fromStored.data) : {}),
    ...(fromOverrides.success ? defined(fromOverrides.data) : {}),
  };
}

/** Extra driving time off the line, there and back, at about 40 km/h. */
export function detourLimitKm(prefs: TripPreferences): number {
  if (prefs.fuel_stop === "on_route") return 0.8;
  return Math.max(0.4, Math.round((prefs.max_detour_min / 3) * 10) / 10);
}

export function effectiveBreakEveryMin(prefs: TripPreferences): number {
  if (!prefs.with_children) return prefs.break_every_min;
  const youngest =
    prefs.children_ages.length === 0 ? 2 : Math.min(...prefs.children_ages);
  if (youngest <= 4) return Math.min(prefs.break_every_min, 75);
  if (youngest <= 8) return Math.min(prefs.break_every_min, 90);
  return Math.min(prefs.break_every_min, 110);
}

export function drivingDayLimits(prefs: TripPreferences): DrivingDayLimits {
  if (!prefs.overnight) {
    return {
      overnight: false,
      overnightAfterMin: 24 * 60,
      overnightAtMin: 24 * 60,
    };
  }
  const extraHours = prefs.drivers >= 2 ? 2 : 0;
  const hours = Math.min(14, prefs.max_driving_hours + extraHours);
  const after = Math.round(hours * 60);
  return {
    overnight: true,
    overnightAfterMin: after,
    overnightAtMin: Math.max(240, after - 30),
  };
}

export function costingFromPreferences(
  prefs: TripPreferences
): ValhallaCosting {
  return {
    useHighways: !prefs.avoid_motorways,
    useTolls: !prefs.avoid_tolls,
  };
}

export function resolveDeparture(
  prefs: TripPreferences,
  requested: string | undefined,
  now: Date
): Date {
  const raw = requested ?? prefs.depart_at;
  if (!raw) return now;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? now : date;
}

export function scenicTypes(
  prefs: TripPreferences
): Array<"attraction" | "viewpoint"> {
  return prefs.pace === "scenic" ? ["attraction", "viewpoint"] : [];
}

export function childAmenityTypes(
  prefs: TripPreferences
): Array<"playground"> {
  return prefs.with_children ? ["playground"] : [];
}

const YES = new Set(["yes", "designated", "permissive", "customers"]);

function tagYes(tags: Record<string, string>, keys: string[]): boolean {
  return keys.some((key) => YES.has((tags[key] ?? "").toLowerCase()));
}

export interface PreferencePlace {
  kind: string;
  tags: Record<string, string>;
  motorwayService: boolean;
  detourKm: number;
}

/** Higher is better. Fuel mode, pets, and children live here; flags are separate. */
export function placePreferenceScore(
  place: PreferencePlace,
  prefs: TripPreferences
): number {
  let score = 0;
  const limit = detourLimitKm(prefs);
  if (place.detourKm > limit && (place.kind === "fuel" || place.kind === "charging")) {
    score -= 40;
  } else if (prefs.fuel_stop === "on_route") {
    if (place.motorwayService || place.detourKm <= 0.4) score += 8;
  } else if (place.detourKm >= 0.4 && place.detourKm <= limit) {
    score += 5;
  }

  if (prefs.with_pet) {
    if (tagYes(place.tags, ["dog", "pets", "pet"])) score += 6;
    if (
      place.tags.leisure ||
      place.tags.garden === "yes" ||
      place.kind === "rest_area"
    ) {
      score += 3;
    }
  }

  if (prefs.with_children) {
    if (tagYes(place.tags, ["playground"]) || place.kind === "playground") {
      score += 6;
    }
    const cuisine = (place.tags.cuisine ?? "").toLowerCase();
    if (
      cuisine.includes("family") ||
      tagYes(place.tags, ["family", "kids"])
    ) {
      score += 4;
    }
  }

  return score;
}

export function allowsBorder(
  borderId: string,
  prefs: TripPreferences
): boolean {
  return !prefs.avoid_borders.includes(borderId);
}
