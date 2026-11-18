import { z } from "zod";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import { isHarshWeather } from "@/lib/trip/notices";

/** The few plan facts the server needs; the full plan never leaves the phone. */
export const TripPushPlanSchema = z.object({
  depart_at: z.string().datetime(),
  speed_kmh: z.number().finite().min(20).max(160),
  stops: z
    .array(
      z.object({
        id: z.string().max(60),
        title: z.string().max(120),
        kinds: z.array(z.string().max(20)).max(4),
        eta: z.string().datetime(),
        optional: z.boolean(),
        saving_eur: z.number().finite().min(0).max(1000).nullable(),
      })
    )
    .max(40),
  /** The border the route crosses, so a push can ask how the wait went. */
  border: z
    .object({
      id: z.string().max(60),
      name: z.string().max(120),
      eta: z.string().datetime(),
      wait_min: z.number().finite().min(0).max(720),
    })
    .nullable()
    .optional(),
  weather: z
    .array(
      z.object({
        eta: z.string().datetime(),
        weather_code: z.number().int().nullish(),
        wind_kmh: z.number().finite().nullish(),
        precipitation_mm: z.number().finite().nullish(),
        summary: z.string().max(160).default(""),
        place: z.string().max(120).nullish(),
      })
    )
    .max(12),
});

export type TripPushPlan = z.infer<typeof TripPushPlanSchema>;

export interface ScheduledPush {
  sendAt: Date;
  title: string;
  body: string;
  tag: string;
  /** Where a tap opens the app; the home map when absent. */
  url?: string;
}

const STOP_LEAD_MIN = 12;
const FUEL_LEAD_MIN = 30;
const WEATHER_LEAD_MIN = 45;
const MAX_PUSHES = 30;
/** After the expected crossing, wait this long before asking how it went. */
const BORDER_AFTER_MIN = 25;

/**
 * Pushes timed from the plan's own arrival times, shifted by how late the
 * trip actually started. They are estimates: a long stop or a jam moves the
 * real arrival, and the text says "about".
 */
export function buildPushSchedule(input: {
  plan: TripPushPlan;
  startedAt: Date;
  now: Date;
  locale: Locale;
}): ScheduledPush[] {
  const { plan, startedAt, now, locale } = input;
  const t = catalog(locale).trip;
  const shift = startedAt.getTime() - Date.parse(plan.depart_at);
  const out: ScheduledPush[] = [];
  const at = (iso: string, leadMin: number) =>
    new Date(Date.parse(iso) + shift - leadMin * 60_000);
  const km = (leadMin: number) => String(Math.round((plan.speed_kmh * leadMin) / 60));

  for (const stop of plan.stops) {
    if (stop.optional || stop.kinds.includes("sight")) continue;
    const energy = stop.kinds.includes("fuel") || stop.kinds.includes("charge");
    if (energy && stop.saving_eur != null && stop.saving_eur >= 1.5) {
      out.push({
        sendAt: at(stop.eta, FUEL_LEAD_MIN),
        title: t.noticeTitle,
        body: formatTemplate(t.noticeFuel, {
          title: stop.title,
          km: km(FUEL_LEAD_MIN),
          saving: stop.saving_eur.toFixed(1),
        }),
        tag: `fuel-${stop.id}`,
      });
    }
    out.push({
      sendAt: at(stop.eta, STOP_LEAD_MIN),
      title: t.noticeTitle,
      body: formatTemplate(t.pushStopSoon, {
        minutes: String(STOP_LEAD_MIN),
        title: stop.title,
      }),
      tag: `stop-${stop.id}`,
    });
  }

  let weatherSent = 0;
  for (const [index, segment] of plan.weather.entries()) {
    if (weatherSent >= 3) break;
    if (
      !isHarshWeather({
        weather_code: segment.weather_code ?? null,
        wind_kmh: segment.wind_kmh ?? null,
        precipitation_mm: segment.precipitation_mm ?? null,
      })
    ) {
      continue;
    }
    weatherSent += 1;
    out.push({
      sendAt: at(segment.eta, WEATHER_LEAD_MIN),
      title: t.noticeTitle,
      body: formatTemplate(t.noticeWeather, {
        summary: segment.summary,
        place: segment.place ?? "",
        km: km(WEATHER_LEAD_MIN),
      })
        .replace(/\s{2,}/g, " ")
        .trim(),
      tag: `weather-${index}`,
    });
  }

  if (plan.border) {
    // The wait is a guess, so the question comes well after the expected crossing.
    out.push({
      sendAt: at(plan.border.eta, -(plan.border.wait_min + BORDER_AFTER_MIN)),
      title: t.noticeTitle,
      body: formatTemplate(t.pushBorderAfter, { name: plan.border.name }),
      tag: `border-${plan.border.id}`,
      url: `/?border=${encodeURIComponent(plan.border.id)}&wait=${Math.round(plan.border.wait_min)}`,
    });
  }

  return out
    .filter((push) => push.sendAt.getTime() > now.getTime())
    .sort((a, b) => a.sendAt.getTime() - b.sendAt.getTime())
    .slice(0, MAX_PUSHES);
}
