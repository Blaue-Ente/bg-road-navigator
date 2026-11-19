import { z } from "zod";

export const TripPreferencePatchSchema = z.object({
  fuel_stop: z.enum(["on_route", "detour"]).optional(),
  max_detour_min: z.number().int().min(0).max(45).optional(),
  break_every_min: z.number().int().min(45).max(240).optional(),
  break_exact: z.boolean().optional(),
  with_pet: z.boolean().optional(),
  avoid_motorways: z.boolean().optional(),
  avoid_tolls: z.boolean().optional(),
  overnight: z.boolean().optional(),
  max_driving_hours: z.number().min(4).max(14).optional(),
  pace: z.enum(["fast", "scenic"]).optional(),
  with_children: z.boolean().optional(),
  children_ages: z.array(z.number().int().min(0).max(17)).max(8).optional(),
  drivers: z.number().int().min(1).max(4).optional(),
  car_comfort: z.enum(["roomy", "standard", "compact"]).optional(),
  /** With two or more drivers: sleep at night, or keep going and swap. */
  night_mode: z.enum(["sleep", "swap"]).optional(),
  /** Tuning: how much a scenic road avoids highways (0.1 most, 1 not at all). */
  scenic_strength: z.number().min(0.1).max(1).optional(),
  adults: z.number().int().min(1).max(8).optional(),
  depart_at: z.string().datetime().nullable().optional(),
  avoid_borders: z.array(z.string().trim().min(1).max(64)).max(12).optional(),
  preferred_border: z.string().trim().min(1).max(64).nullable().optional(),
  location_opt_in: z.boolean().optional(),
  notifications_opt_in: z.boolean().optional(),
  alert_radius_m: z.number().int().min(200).max(5000).optional(),
});

export type TripPreferencePatch = z.infer<typeof TripPreferencePatchSchema>;

export interface TripPreferences {
  fuel_stop: "on_route" | "detour";
  max_detour_min: number;
  break_every_min: number;
  /** Keep exactly the chosen break interval instead of shortening it for young children. */
  break_exact: boolean;
  with_pet: boolean;
  avoid_motorways: boolean;
  avoid_tolls: boolean;
  overnight: boolean;
  max_driving_hours: number;
  pace: "fast" | "scenic";
  with_children: boolean;
  children_ages: number[];
  drivers: number;
  /** How roomy the car is: a van or SUV is easier on a long day than a small car. */
  car_comfort: "roomy" | "standard" | "compact";
  night_mode: "sleep" | "swap";
  scenic_strength: number;
  /** Adults in the car, used for the hotel search. Drivers are among them. */
  adults: number;
  depart_at: string | null;
  avoid_borders: string[];
  preferred_border: string | null;
  /** Continuous GPS for hazard alerts. Off until the person turns it on. */
  location_opt_in: boolean;
  notifications_opt_in: boolean;
  alert_radius_m: number;
}

export const DEFAULT_TRIP_PREFERENCES: TripPreferences = {
  fuel_stop: "detour",
  max_detour_min: 8,
  break_every_min: 135,
  break_exact: false,
  with_pet: false,
  avoid_motorways: false,
  avoid_tolls: false,
  overnight: true,
  max_driving_hours: 12,
  pace: "fast",
  with_children: false,
  children_ages: [],
  drivers: 1,
  car_comfort: "standard",
  night_mode: "sleep",
  scenic_strength: 0.3,
  adults: 1,
  depart_at: null,
  avoid_borders: [],
  preferred_border: null,
  location_opt_in: false,
  notifications_opt_in: false,
  alert_radius_m: 1000,
};

export interface ValhallaCosting {
  useHighways: boolean;
  useTolls: boolean;
  scenicStrength?: number;
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

/** Longest stretch between breaks that is applied for the youngest child. */
export function childBreakCapMin(prefs: TripPreferences): number | null {
  if (!prefs.with_children) return null;
  const youngest =
    prefs.children_ages.length === 0 ? 2 : Math.min(...prefs.children_ages);
  if (youngest <= 4) return 75;
  if (youngest <= 8) return 90;
  return 110;
}

/** A small car tires people sooner: stops come at least this often. */
const COMPACT_BREAK_CAP_MIN = 105;
/** A small car also shortens the driving day by this many hours. */
const COMPACT_DAY_CUT_H = 1.5;

export function effectiveBreakEveryMin(prefs: TripPreferences): number {
  const base = childAdjustedBreakMin(prefs);
  if (prefs.car_comfort === "compact" && !prefs.break_exact) {
    return Math.min(base, COMPACT_BREAK_CAP_MIN);
  }
  return base;
}

function childAdjustedBreakMin(prefs: TripPreferences): number {
  if (!prefs.with_children || prefs.break_exact) return prefs.break_every_min;
  const youngest =
    prefs.children_ages.length === 0 ? 2 : Math.min(...prefs.children_ages);
  if (youngest <= 4) return Math.min(prefs.break_every_min, 75);
  if (youngest <= 8) return Math.min(prefs.break_every_min, 90);
  return Math.min(prefs.break_every_min, 110);
}

/** Hours of driving after which an overnight stop is planned. */
export function drivingDayHours(prefs: TripPreferences): number {
  const limits = drivingDayLimits(prefs);
  return limits.overnight ? Math.round((limits.overnightAfterMin / 60) * 10) / 10 : 24;
}

/**
 * Hours on the road in one day after which a driver should stop: 10 without
 * children, 8 with them. A warning level (the plan says so when a day goes
 * past it); with swapping drivers it is also the cap for the day.
 */
export function healthDayLimitH(prefs: TripPreferences): number {
  if (swapActive(prefs)) {
    // Drivers take turns: about seven hours each, and no more than this in a day.
    return Math.min(7 * prefs.drivers, prefs.with_children ? 12 : 16);
  }
  return prefs.with_children ? 8 : 10;
}

/** Two or more drivers who chose to keep going at night and swap. */
export function swapActive(prefs: TripPreferences): boolean {
  return prefs.night_mode === "swap" && prefs.drivers >= 2;
}

export function drivingDayLimits(prefs: TripPreferences): DrivingDayLimits {
  if (!prefs.overnight) {
    return {
      overnight: false,
      overnightAfterMin: 24 * 60,
      overnightAtMin: 24 * 60,
    };
  }
  // A day is used from the early start until the evening, so the driver's own
  // maximum rules (default 12 h). The 10 h / 8 h with children level only
  // raises a warning (`healthDayLimitH`). Swapping lifts the day to the swap limit.
  const comfortCut = prefs.car_comfort === "compact" ? COMPACT_DAY_CUT_H : 0;
  const baseHours = swapActive(prefs)
    ? healthDayLimitH(prefs)
    : prefs.max_driving_hours;
  const hours = Math.max(4, Math.min(16, baseHours - comfortCut));
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
    scenicStrength: prefs.scenic_strength,
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

export function childAmenityTypes(prefs: TripPreferences): Array<"playground"> {
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
  if (
    place.detourKm > limit &&
    (place.kind === "fuel" || place.kind === "charging")
  ) {
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
    if (cuisine.includes("family") || tagYes(place.tags, ["family", "kids"])) {
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
