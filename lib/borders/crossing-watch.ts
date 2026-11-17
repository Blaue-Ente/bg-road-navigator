import { haversineKm } from "@/lib/geo/haversine";

/**
 * Measures how long a driver spent at a border, from position fixes alone.
 *
 * It only works while the app is open and receiving positions. The wait runs
 * from the first slow fix inside the crossing's zone to the first fast fix after
 * the country changed. A pass that turns round, a fuel stop beside the road, or
 * a stretch with no fixes does not produce a trustworthy number.
 */
export interface Fix {
  lng: number;
  lat: number;
  /** Milliseconds since the epoch. */
  t: number;
  /** From the device, when it gives one. */
  speedKmh?: number | null;
}

export interface CrossingPoint {
  id: string;
  lng: number;
  lat: number;
}

export interface Measurement {
  crossingId: string;
  /** When the wait began (the first slow fix, else zone entry). */
  startedAt: number;
  /** When the driver was moving freely on the other side. */
  endedAt: number;
  minutes: number;
  fromCountry: string | null;
  toCountry: string | null;
  /** False when fixes were missing for a long stretch: ask the driver to check. */
  reliable: boolean;
  /** "estimate" when it comes from a reminder, not from positions: the number is the plan's guess. */
  origin?: "estimate";
}

export type WatchState =
  | { phase: "idle" }
  | {
      phase: "inside";
      crossingId: string;
      enteredAt: number;
      startedAt: number | null;
      fromCountry: string | null;
      toCountry: string | null;
      crossedAt: number | null;
      lastFix: Fix;
      fixes: number;
      gap: boolean;
    };

/** Wait counts from here. */
export const ENTER_KM = 3;
/** Leaving this far without crossing ends the watch. */
export const EXIT_KM = 5;
/** Moving freely again: this far from the crossing... */
export const FREE_KM = 1.5;
/** ...or this fast. */
export const FREE_KMH = 25;
/** Slower than this inside the zone counts as queueing. */
export const SLOW_KMH = 15;
/** Fixes further apart than this leave a hole in the measurement. */
export const GAP_MS = 8 * 60_000;
/** A watch that has run this long is stale. */
export const MAX_WATCH_MS = 8 * 3_600_000;
/** Below this the driver did not really wait, so nothing is asked. */
export const MIN_MINUTES = 5;

/**
 * How fast the driver is going at a fix. A device speed is a reading at that
 * moment; one worked out from two positions describes the time in between.
 */
function speedOf(
  fix: Fix,
  previous: Fix | null
): { kmh: number; sinceMs: number } | null {
  if (typeof fix.speedKmh === "number" && Number.isFinite(fix.speedKmh)) {
    return { kmh: fix.speedKmh, sinceMs: fix.t };
  }
  if (!previous || fix.t <= previous.t) return null;
  const km = haversineKm(previous, fix);
  return { kmh: km / ((fix.t - previous.t) / 3_600_000), sinceMs: previous.t };
}

export function nearestCrossing(
  fix: Pick<Fix, "lng" | "lat">,
  crossings: CrossingPoint[]
): { crossing: CrossingPoint; km: number } | null {
  let best: { crossing: CrossingPoint; km: number } | null = null;
  for (const crossing of crossings) {
    const km = haversineKm(fix, crossing);
    if (!best || km < best.km) best = { crossing, km };
  }
  return best;
}

/** One step of the watch. `done` is set once, when a crossing has been measured. */
export function stepWatch(
  state: WatchState,
  fix: Fix,
  crossings: CrossingPoint[],
  countryAt: (lng: number, lat: number) => string | null
): { state: WatchState; done: Measurement | null } {
  if (state.phase === "idle") {
    const near = nearestCrossing(fix, crossings);
    if (!near || near.km > ENTER_KM) return { state, done: null };
    const speed = speedOf(fix, null);
    return {
      state: {
        phase: "inside",
        crossingId: near.crossing.id,
        enteredAt: fix.t,
        startedAt: speed !== null && speed.kmh < SLOW_KMH ? fix.t : null,
        fromCountry: countryAt(fix.lng, fix.lat),
        toCountry: null,
        crossedAt: null,
        lastFix: fix,
        fixes: 1,
        gap: false,
      },
      done: null,
    };
  }

  const crossing = crossings.find((candidate) => candidate.id === state.crossingId);
  if (!crossing || fix.t - state.enteredAt > MAX_WATCH_MS || fix.t < state.lastFix.t) {
    return { state: { phase: "idle" }, done: null };
  }

  const km = haversineKm(fix, crossing);
  const speed = speedOf(fix, state.lastFix);
  const gap = state.gap || fix.t - state.lastFix.t > GAP_MS;
  const country = countryAt(fix.lng, fix.lat);
  const crossedNow =
    state.crossedAt === null &&
    state.fromCountry !== null &&
    country !== null &&
    country !== state.fromCountry;

  const next = {
    ...state,
    lastFix: fix,
    fixes: state.fixes + 1,
    gap,
    startedAt:
      state.startedAt === null &&
      state.crossedAt === null &&
      speed !== null &&
      speed.kmh < SLOW_KMH
        ? speed.sinceMs
        : state.startedAt,
    crossedAt: crossedNow ? fix.t : state.crossedAt,
    toCountry: crossedNow ? country : state.toCountry,
  } satisfies WatchState;

  if (next.crossedAt !== null) {
    const free = km >= FREE_KM || (speed !== null && speed.kmh >= FREE_KMH);
    if (!free) return { state: next, done: null };
    const startedAt = next.startedAt ?? next.enteredAt;
    const minutes = Math.round((fix.t - startedAt) / 60_000);
    return {
      state: { phase: "idle" },
      done:
        minutes >= MIN_MINUTES
          ? {
              crossingId: next.crossingId,
              startedAt,
              endedAt: fix.t,
              minutes,
              fromCountry: next.fromCountry,
              toCountry: next.toCountry,
              reliable: !next.gap && next.fixes >= 3,
            }
          : null,
    };
  }

  // Left the zone without crossing: a turn-back, a fuel stop beside the road.
  if (km > EXIT_KM) return { state: { phase: "idle" }, done: null };
  return { state: next, done: null };
}
