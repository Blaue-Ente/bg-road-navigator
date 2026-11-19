export type BreakKind = "fuel" | "charge" | "rest" | "overnight";

export const DWELL_MIN = {
  rest: 15,
  fuel: 15,
  meal: 40,
  combined: 25,
  overnight: 0,
} as const;

export function dwellMinForKinds(
  kinds: BreakKind[],
  withChildren: boolean
): number {
  if (kinds.includes("overnight")) return DWELL_MIN.overnight;
  const hasEnergy = kinds.includes("fuel") || kinds.includes("charge");
  const hasRest = kinds.includes("rest");
  if (hasEnergy && hasRest) return DWELL_MIN.combined;
  if (hasEnergy) return DWELL_MIN.fuel;
  if (hasRest) return withChildren ? 20 : DWELL_MIN.rest;
  return 0;
}

export function dwellMinutesBefore(
  drivingMin: number,
  stops: Array<{ etaMin: number; kinds: BreakKind[] }>,
  withChildren: boolean
): number {
  let total = 0;
  for (const stop of stops) {
    if (stop.etaMin < drivingMin) {
      total += dwellMinForKinds(stop.kinds, withChildren);
    }
  }
  return total;
}

export function totalDwellMinutes(
  stops: Array<{ etaMin: number; kinds: BreakKind[] }>,
  withChildren: boolean
): number {
  return dwellMinutesBefore(Number.POSITIVE_INFINITY, stops, withChildren);
}

export interface SleepShift {
  afterDrivingMin: number;
  sleepMin: number;
}

const SOFIA_TZ = "Europe/Sofia";

export interface TimedStop {
  kinds: BreakKind[];
  distanceKm: number;
  etaMin: number;
}

export interface FuelTimedStop {
  kind: "fuel" | "charge";
  distanceKm: number;
  etaMin: number;
}

export interface MergeBreaksInput {
  driveMin: number;
  distanceKm: number;
  breakEveryMin: number;
  /** Fuel and rest stops closer than this share one stop. */
  mergeWithinMin: number;
  /** Driving time after which an overnight window is suggested. */
  overnightAfterMin: number;
  /** Where to place each overnight anchor, in driving minutes. */
  overnightAtMin?: number;
  fuelStops: FuelTimedStop[];
}

const DEFAULT_OVERNIGHT_AT_MIN = 600;
/**
 * The first overnight stop is kept when only a little driving is left (the day
 * limit is passed). A further one needs this much driving left after it,
 * otherwise the driver simply pushes on to the end.
 */
export const OVERNIGHT_MIN_REMAINING_MIN = 180;

/**
 * Rest after `breakEveryMin` of driving since the last stop of any kind.
 * Fuel, charge and overnight stops are breaks too: they reset the clock, so a
 * longer interval chosen by the driver is not undercut by extra rests between
 * them. A rest due within `mergeWithinMin` before a forced stop is folded into
 * it, and a forced stop up to `mergeWithinMin` after the due time delays the
 * rest to that stop. An overnight window appears once the driving time passes
 * `overnightAfterMin`, then again each further block of driving.
 */
export function mergeDrivingBreaks(input: MergeBreaksInput): TimedStop[] {
  const driveMin = Math.max(0, input.driveMin);
  const every = Math.max(30, input.breakEveryMin);
  const within = Math.max(0, input.mergeWithinMin);
  const overnightAfter = input.overnightAfterMin;
  const overnightAt = input.overnightAtMin ?? DEFAULT_OVERNIGHT_AT_MIN;
  const distanceKm = Math.max(0, input.distanceKm);
  const forcedDrafts: TimedStop[] = [];
  const atKm = (minute: number) =>
    driveMin <= 0 ? 0 : Math.round((minute / driveMin) * distanceKm * 10) / 10;

  for (const fuel of input.fuelStops) {
    if (fuel.etaMin >= driveMin - 5) continue;
    forcedDrafts.push({
      kinds: [fuel.kind],
      distanceKm: fuel.distanceKm,
      etaMin: fuel.etaMin,
    });
  }

  if (driveMin > overnightAfter) {
    for (
      let minute = overnightAt;
      minute < driveMin - (minute === overnightAt ? 45 : OVERNIGHT_MIN_REMAINING_MIN);
      minute += overnightAt
    ) {
      forcedDrafts.push({
        kinds: ["overnight"],
        distanceKm: atKm(minute),
        etaMin: minute,
      });
    }
  }

  forcedDrafts.sort((a, b) => a.etaMin - b.etaMin);
  const forced = cluster(forcedDrafts, within);

  const result: TimedStop[] = [];
  let lastStopMin = 0;
  let nextForced = 0;
  for (;;) {
    const due = lastStopMin + every;
    const upcoming = forced[nextForced];
    if (upcoming && upcoming.etaMin <= due + within) {
      const isOvernight = upcoming.kinds.includes("overnight");
      if (!isOvernight && upcoming.etaMin >= due - within) {
        upcoming.kinds.push("rest");
      }
      result.push(upcoming);
      lastStopMin = upcoming.etaMin;
      nextForced += 1;
      continue;
    }
    if (due >= driveMin - 30) break;
    result.push({ kinds: ["rest"], distanceKm: atKm(due), etaMin: due });
    lastStopMin = due;
  }
  return result;
}

function cluster(drafts: TimedStop[], withinMin: number): TimedStop[] {
  const clusters: TimedStop[] = [];
  for (const draft of drafts) {
    const current = clusters[clusters.length - 1];
    if (current && Math.abs(draft.etaMin - current.etaMin) <= withinMin) {
      mergeInto(current, draft);
      continue;
    }
    clusters.push({
      kinds: [...draft.kinds],
      distanceKm: draft.distanceKm,
      etaMin: draft.etaMin,
    });
  }
  return clusters;
}

function mergeInto(target: TimedStop, extra: TimedStop) {
  for (const kind of extra.kinds) {
    if (!target.kinds.includes(kind)) target.kinds.push(kind);
  }
  const targetHasEnergy =
    target.kinds.includes("fuel") || target.kinds.includes("charge");
  const extraHasEnergy =
    extra.kinds.includes("fuel") || extra.kinds.includes("charge");
  if (!targetHasEnergy && extraHasEnergy) {
    target.distanceKm = extra.distanceKm;
    target.etaMin = extra.etaMin;
  }
}

/** Overnight sleep anchors in driving minutes (same rhythm as mergeDrivingBreaks). */
export function sleepShifts(input: {
  driveMin: number;
  overnight: boolean;
  overnightAfterMin: number;
  overnightAtMin: number;
}): SleepShift[] {
  if (!input.overnight || input.driveMin <= input.overnightAfterMin) {
    return [];
  }
  const overnightAt = input.overnightAtMin ?? DEFAULT_OVERNIGHT_AT_MIN;
  const shifts: SleepShift[] = [];
  for (
    let minute = overnightAt;
    minute <
    input.driveMin -
      (minute === overnightAt ? 45 : OVERNIGHT_MIN_REMAINING_MIN);
    minute += overnightAt
  ) {
    shifts.push({ afterDrivingMin: minute, sleepMin: 0 });
  }
  return shifts;
}

/** Planned sleep: 8 hours is the aim, 6 the least. */
export const SLEEP_AIM_MIN = 8 * 60;
export const SLEEP_LEAST_MIN = 6 * 60;

/**
 * Wall-clock wake for a stop. The night is the 22:00-05:00 window:
 * - arriving by day (05:00-15:59, typical after driving through the night) is a
 *   rest: eight hours, then on;
 * - arriving early in the evening (16:00-21:59) sleeps until at least 05:00;
 * - arriving inside the window sleeps eight hours when that ends by 07:00,
 *   otherwise wakes at 07:00 (never less than six hours).
 */
export function wakeAt(
  arrival: Date,
  timeZone: string = SOFIA_TZ
): Date {
  const aim = new Date(arrival.getTime() + SLEEP_AIM_MIN * 60_000);
  const least = new Date(arrival.getTime() + SLEEP_LEAST_MIN * 60_000);
  const local = localYmdHm(arrival, timeZone);
  if (!local) return aim;
  if (local.hour >= 5 && local.hour < 16) return aim;
  if (local.hour >= 16 && local.hour < 22) {
    const dawn = nextLocalHour(arrival, timeZone, 5);
    return aim.getTime() >= dawn.getTime() ? aim : dawn;
  }
  const seven = nextLocalHour(arrival, timeZone, 7);
  if (aim.getTime() <= seven.getTime()) return aim;
  return least.getTime() >= seven.getTime() ? least : seven;
}

export function sleepShiftsFromPlanStops(
  stops: Array<{ driving_min: number; sleep_min?: number | null }>
): SleepShift[] {
  return stops
    .filter((stop) => stop.sleep_min != null && stop.sleep_min > 0)
    .map((stop) => ({
      afterDrivingMin: stop.driving_min,
      sleepMin: stop.sleep_min!,
    }));
}

export function sleepMinutesBefore(
  drivingMin: number,
  shifts: SleepShift[]
): number {
  let total = 0;
  for (const shift of shifts) {
    if (shift.afterDrivingMin < drivingMin) {
      total += shift.sleepMin;
    }
  }
  return total;
}

export function resolveSleepShifts(input: {
  departAt: Date;
  shifts: SleepShift[];
  extraWaitMin: (drivingMin: number) => number;
  timeZone?: string;
  timeZoneAt?: (drivingMin: number) => string;
  breakStops?: Array<{ etaMin: number; kinds: BreakKind[] }>;
  withChildren?: boolean;
}): SleepShift[] {
  const resolved: SleepShift[] = [];
  const withChildren = input.withChildren ?? false;
  const breakStops = input.breakStops ?? [];
  for (const anchor of input.shifts) {
    const tz =
      input.timeZoneAt?.(anchor.afterDrivingMin) ??
      input.timeZone ??
      SOFIA_TZ;
    const sleepSoFar = resolved.reduce((sum, row) => sum + row.sleepMin, 0);
    const wait = input.extraWaitMin(anchor.afterDrivingMin);
    const dwell = dwellMinutesBefore(
      anchor.afterDrivingMin,
      breakStops,
      withChildren
    );
    const arrival = new Date(
      input.departAt.getTime() +
        (anchor.afterDrivingMin + wait + sleepSoFar + dwell) * 60_000
    );
    const wake = wakeAt(arrival, tz);
    const sleepMin = Math.max(
      0,
      Math.round((wake.getTime() - arrival.getTime()) / 60_000)
    );
    resolved.push({ afterDrivingMin: anchor.afterDrivingMin, sleepMin });
  }
  return resolved;
}

export function wallClockEta(input: {
  departAt: Date;
  drivingMin: number;
  extraWaitMin: number;
  sleepShifts: SleepShift[];
  dwellMin?: number;
}): Date {
  const sleep = sleepMinutesBefore(input.drivingMin, input.sleepShifts);
  const dwell = input.dwellMin ?? 0;
  return new Date(
    input.departAt.getTime() +
      (input.drivingMin + input.extraWaitMin + sleep + dwell) * 60_000
  );
}

export function formatWakeLabel(
  wake: Date,
  timeZone: string = SOFIA_TZ
): string {
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(wake);
}

/** The next local `hour`:00 after `from` (today's when it is still ahead). */
function nextLocalHour(from: Date, timeZone: string, hour: number): Date {
  const parts = localYmdHm(from, timeZone);
  if (!parts) {
    return new Date(from.getTime() + SLEEP_AIM_MIN * 60_000);
  }
  let { year, month, day } = parts;
  const minute = 0;
  if (parts.hour > hour || (parts.hour === hour && parts.minute > 0)) {
    const next = addLocalDays(year, month, day, 1);
    year = next.year;
    month = next.month;
    day = next.day;
  }
  return localDateTimeToUtc(year, month, day, hour, minute, timeZone);
}

function localYmdHm(
  at: Date,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if (
      [year, month, day, hour, minute].some((n) => !Number.isFinite(n))
    ) {
      return null;
    }
    return { year, month, day, hour, minute };
  } catch {
    return null;
  }
}

function localDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const guess = new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00.000Z`
  );
  const offset = timeZoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offset * 60_000);
}

function timeZoneOffsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const mins = Number(match[3] ?? "0");
  return sign * (hours * 60 + mins);
}

function addLocalDays(year: number, month: number, day: number, delta: number) {
  const utc = Date.UTC(year, month - 1, day + delta);
  const d = new Date(utc);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
