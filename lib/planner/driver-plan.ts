import type { PlanStop } from "@/lib/planner/types";

/** Longest turn at the wheel before the next driver takes over, in driving minutes. */
export const DRIVER_STINT_MIN = 150;
/** A turn may run this much past the stint before a swap is forced at an earlier stop. */
const STINT_SLACK_MIN = 30;

export interface DriverTurn {
  /** 1-based, as the driver is named on the form. */
  driver: number;
  from_label: string;
  from_eta: string;
  from_km: number;
  until_label: string;
  until_eta: string;
  until_km: number;
  /** Driving minutes in this turn. */
  driving_min: number;
}

export interface DriverPlan {
  drivers: number;
  stint_min: number;
  turns: DriverTurn[];
  /** Driving minutes for each driver over the whole trip. */
  per_driver_min: number[];
}

/**
 * Who drives when: the wheel goes round the drivers at the first stop after a
 * turn has reached the stint length, and after a night's sleep the next driver
 * starts. The plan's own stops are the hand-over places.
 */
export function buildDriverPlan(input: {
  drivers: number;
  stops: PlanStop[];
  startLabel: string;
  startEta: string;
  endLabel: string;
  endEta: string;
  totalKm: number;
  totalDrivingMin: number;
  stintMin?: number;
}): DriverPlan | null {
  const drivers = Math.min(4, Math.max(1, Math.round(input.drivers)));
  if (drivers < 2) return null;
  const stint = input.stintMin ?? DRIVER_STINT_MIN;
  const real = input.stops
    .filter((stop) => !stop.optional && !stop.kinds.includes("sight"))
    .sort((a, b) => a.driving_min - b.driving_min);

  const turns: DriverTurn[] = [];
  let driver = 1;
  let turnStart = { label: input.startLabel, eta: input.startEta, km: 0, drivingMin: 0 };

  const close = (until: { label: string; eta: string; km: number; drivingMin: number }) => {
    turns.push({
      driver,
      from_label: turnStart.label,
      from_eta: turnStart.eta,
      from_km: turnStart.km,
      until_label: until.label,
      until_eta: until.eta,
      until_km: until.km,
      driving_min: Math.max(0, Math.round(until.drivingMin - turnStart.drivingMin)),
    });
  };

  for (const [index, stop] of real.entries()) {
    const here = {
      label: stop.place_name ?? stop.title,
      eta: stop.eta,
      km: stop.distance_from_start_km,
      drivingMin: stop.driving_min,
    };
    const slept = stop.kinds.includes("overnight") && (stop.sleep_min ?? 0) > 0;
    // Swap here when the turn is full, or when driving on to the next stop would
    // take it well past the stint: a turn should not run long because stops are far apart.
    const elapsed = here.drivingMin - turnStart.drivingMin;
    const next = real[index + 1];
    const afterNext = (next ? next.driving_min : input.totalDrivingMin) - turnStart.drivingMin;
    const due = elapsed >= stint || (elapsed >= stint * 0.6 && afterNext > stint + STINT_SLACK_MIN);
    if (!due && !slept) continue;
    close(here);
    driver = (driver % drivers) + 1;
    turnStart = here;
  }
  close({
    label: input.endLabel,
    eta: input.endEta,
    km: input.totalKm,
    drivingMin: input.totalDrivingMin,
  });

  const perDriver = new Array<number>(drivers).fill(0);
  for (const turn of turns) perDriver[turn.driver - 1]! += turn.driving_min;
  // A turn that ends where it began is noise.
  const kept = turns.filter((turn) => turn.driving_min > 0 || turn.from_label !== turn.until_label);
  return { drivers, stint_min: stint, turns: kept, per_driver_min: perDriver };
}
