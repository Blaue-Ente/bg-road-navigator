import { effectiveBreakEveryMin } from "@/lib/planner/preferences";
import type { TripPlannerResult } from "@/lib/planner/types";
import type { TripProgress } from "@/lib/trip/progress";

export type TripNoticeKind = "rest" | "restSoon" | "weather" | "fuel";

export interface TripNotice {
  /** Stable, so each notice is shown once per trip. */
  id: string;
  kind: TripNoticeKind;
  values: Record<string, string>;
}

const WEATHER_LOOKAHEAD_KM = 250;
const FUEL_LOOKAHEAD_KM = 90;
const REST_SOON_KM = 40;
/** A saving below this is not worth a suggestion. */
const MIN_SAVING_EUR = 1.5;

/** Heavy rain, snow, fog, storms or strong wind. */
export function isHarshWeather(segment: {
  weather_code: number | null;
  wind_kmh: number | null;
  precipitation_mm: number | null;
}): boolean {
  const code = segment.weather_code;
  if (code != null) {
    if (code >= 95) return true;
    if (code === 45 || code === 48) return true;
    if (code >= 65 && code <= 67) return true;
    if (code >= 71 && code <= 77) return true;
    if (code >= 82 && code <= 86) return true;
  }
  if ((segment.wind_kmh ?? 0) >= 60) return true;
  return (segment.precipitation_mm ?? 0) >= 5;
}

/**
 * Helpful nudges for the stretch ahead: a rest when the driver has gone long
 * without a stop, harsh weather ahead, and a cheap fuel stop coming up. Pure
 * and rule-based, so it works offline and costs nothing; an AI model may
 * rephrase the text later but never decides when to speak.
 */
export function tripNotices(input: {
  plan: TripPlannerResult;
  progress: TripProgress;
}): TripNotice[] {
  const { plan, progress } = input;
  const notices: TripNotice[] = [];
  const along = progress.alongKm;
  const speedKmh = Math.max(
    20,
    plan.route.distance_km / Math.max(1, plan.route.duration_min / 60)
  );
  const real = plan.stops.filter(
    (stop) => !stop.optional && !stop.kinds.includes("sight")
  );

  // Rest: minutes of driving since the last stop passed.
  const passed = real
    .filter((stop) => stop.distance_from_start_km <= along)
    .map((stop) => stop.distance_from_start_km);
  const lastStopKm = passed.length ? Math.max(...passed) : 0;
  const sinceMin = ((along - lastStopKm) / speedKmh) * 60;
  const every = effectiveBreakEveryMin(plan.preferences);
  const next = progress.next;
  if (along > 1 && sinceMin >= every * 0.9) {
    const hours = (sinceMin / 60).toFixed(1);
    if (next && next.distanceKm <= REST_SOON_KM) {
      notices.push({
        id: `restSoon-${Math.round(lastStopKm)}`,
        kind: "restSoon",
        values: {
          title: next.stop.title,
          km: String(Math.round(next.distanceKm)),
        },
      });
    } else if (sinceMin >= every) {
      notices.push({
        id: `rest-${Math.round(lastStopKm)}`,
        kind: "rest",
        values: {
          hours,
          km: next ? String(Math.round(next.distanceKm)) : "",
        },
      });
    }
  }

  // Weather: the first harsh segment within reach.
  plan.weather.segments.forEach((segment, index) => {
    const ahead = segment.distance_from_start_km - along;
    if (ahead < 0 || ahead > WEATHER_LOOKAHEAD_KM) return;
    if (!isHarshWeather(segment)) return;
    if (notices.some((notice) => notice.kind === "weather")) return;
    notices.push({
      id: `weather-${index}`,
      kind: "weather",
      values: {
        summary: segment.summary_bg,
        place: segment.place ?? "",
        km: String(Math.round(ahead)),
      },
    });
  });

  // Fuel: a worthwhile saving at a stop that is coming up.
  for (const stop of real) {
    if (!stop.kinds.includes("fuel") || !stop.advice) continue;
    const ahead = stop.distance_from_start_km - along;
    if (ahead < 0 || ahead > FUEL_LOOKAHEAD_KM) continue;
    if (stop.advice.est_savings_eur < MIN_SAVING_EUR) continue;
    notices.push({
      id: `fuel-${stop.id}`,
      kind: "fuel",
      values: {
        title: stop.title,
        km: String(Math.round(ahead)),
        saving: stop.advice.est_savings_eur.toFixed(1),
      },
    });
    break;
  }

  return notices;
}
