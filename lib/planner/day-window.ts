import type { DrivingDayLimits } from "@/lib/planner/preferences";

/** The night: sleep is planned inside this window, local time. */
export const SLEEP_WINDOW = { startHour: 22, endHour: 5 } as const;
/** A day start from here to 18:00 is used until the evening. */
export const DAY_START_FROM_HOUR = 3;
export const NIGHT_START_FROM_HOUR = 18;
/** Share of the clock spent driving once rests are counted (135 min driving, about 20 min stop). */
const DRIVING_SHARE = 0.87;
/** A night start swaps drivers after about this long at the wheel. */
export const NIGHT_STINT_MIN = 330;

export function localHourDecimal(at: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour + minute / 60;
  } catch {
    return null;
  }
}

/** True for a start from 18:00 to 03:00: the first night is driven, not slept. */
export function isNightStart(hour: number): boolean {
  return hour >= NIGHT_START_FROM_HOUR || hour < DAY_START_FROM_HOUR;
}

/**
 * Where the first overnight goes. A day start drives until about 22:00 (or the
 * day's maximum, whichever comes first), then sleeps in the 22:00-05:00 window.
 * A night start drives through the night; the stop comes at the day's maximum.
 */
export function windowedDayLimits(input: {
  departAt: Date;
  timeZone: string;
  limits: DrivingDayLimits;
}): DrivingDayLimits & { nightStart: boolean } {
  const hour = localHourDecimal(input.departAt, input.timeZone);
  if (!input.limits.overnight || hour == null) {
    return { ...input.limits, nightStart: false };
  }
  const nightStart = isNightStart(hour);
  const capMin = input.limits.overnightAfterMin;
  if (nightStart) {
    return { ...input.limits, nightStart: true };
  }
  const toEveningMin = (SLEEP_WINDOW.startHour - hour) * 60;
  const evening = Math.floor(toEveningMin * DRIVING_SHARE);
  const at = Math.max(240, Math.min(capMin, evening));
  return {
    overnight: true,
    overnightAtMin: at,
    overnightAfterMin: at + 30,
    nightStart: false,
  };
}
