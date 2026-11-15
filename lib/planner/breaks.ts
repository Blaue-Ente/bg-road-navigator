export type BreakKind = "fuel" | "charge" | "rest" | "overnight";

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
 * Rest about every 2–2.5 h of driving. An overnight window appears once the
 * driving time passes ~10.5 h, then again each further block of driving.
 * A rest or overnight within `mergeWithinMin` of a fuel stop is folded into it.
 */
export function mergeDrivingBreaks(input: MergeBreaksInput): TimedStop[] {
  const driveMin = Math.max(0, input.driveMin);
  const every = Math.max(30, input.breakEveryMin);
  const within = Math.max(0, input.mergeWithinMin);
  const overnightAfter = input.overnightAfterMin;
  const overnightAt = input.overnightAtMin ?? DEFAULT_OVERNIGHT_AT_MIN;
  const distanceKm = Math.max(0, input.distanceKm);
  const drafts: TimedStop[] = [];
  const atKm = (minute: number) =>
    driveMin <= 0 ? 0 : Math.round((minute / driveMin) * distanceKm * 10) / 10;

  for (const fuel of input.fuelStops) {
    if (fuel.etaMin >= driveMin - 5) continue;
    drafts.push({
      kinds: [fuel.kind],
      distanceKm: fuel.distanceKm,
      etaMin: fuel.etaMin,
    });
  }

  if (driveMin > overnightAfter) {
    for (
      let minute = overnightAt;
      minute < driveMin - 45;
      minute += overnightAt
    ) {
      drafts.push({
        kinds: ["overnight"],
        distanceKm: atKm(minute),
        etaMin: minute,
      });
    }
  }

  for (let minute = every; minute < driveMin - 30; minute += every) {
    drafts.push({
      kinds: ["rest"],
      distanceKm: atKm(minute),
      etaMin: minute,
    });
  }

  drafts.sort((a, b) => a.etaMin - b.etaMin);
  return cluster(drafts, within);
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
