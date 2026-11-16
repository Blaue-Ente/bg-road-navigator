import { HATARINFO_ATTRIBUTION } from "@/lib/constants/border-official-links";
import { formatTemplate } from "@/lib/i18n/format-template";
import { catalog, type Locale } from "@/lib/i18n/locale";
import type {
  NakordoniAttribution,
  WaitEstimate,
  WaitSource,
} from "@/lib/planner/types";

export const NAKORDONI_ATTRIBUTION: NakordoniAttribution = {
  text: "Data by nakordoni.eu",
  href: "https://nakordoni.eu/",
  terms: "https://nakordoni.eu/en/p/developer_api_terms",
};

export interface ForecastPoint {
  at: string | null;
  hour: number | null;
  waitMin: number | null;
  queue: number | null;
}

export interface DayStatsMatrix {
  timeZone: string;
  /** matrix[monday=0][hour] typical queue median. */
  matrix: number[][];
  quality: "high" | "low" | null;
  generatedAt: string | null;
}

export interface CurrentQueue {
  waitMin: number | null;
  queueNow: number | null;
  quality: "high" | "low" | null;
  observedAt: string | null;
  ageMin: number | null;
}

export interface ExpectedWaitInput {
  eta: Date;
  now: Date;
  forecast: ForecastPoint[] | null;
  dayStats: DayStatsMatrix | null;
  current: CurrentQueue | null;
  /** 24 local hours from our own crossing table. Not Nakordoni data. */
  localTypical: number[] | null;
  timeZone?: string;
  /**
   * False when the crossing's markets are not in NAKORDONI_LICENSED_MARKETS.
   * Nakordoni cache is ignored and the local table is the wait.
   */
  licensed?: boolean;
  /** Live TomTom delay near the crossing, minutes. */
  trafficDelayMin?: number | null;
  /**
   * Indicative car wait from Hungarian Police Hárinfó.
   * Used for a Serbia–Hungary crossing ahead of the local typical table.
   */
  hatarinfo?: {
    minutes: number;
    band: "under_15" | "measured";
    observedAt: string | null;
  } | null;
  locale?: Locale;
}

const FORECAST_WINDOW_MS = 75 * 60 * 1000;

/**
 * Wait at the moment the driver reaches the crossing.
 * Forecast, then the typical weekday/hour, then the cached current queue,
 * then the local table. Missing data stays zero and says so.
 */
export function expectedWait(input: ExpectedWaitInput): WaitEstimate {
  const locale = input.locale ?? "bg";
  if (input.licensed === false) {
    if (input.hatarinfo) return hatarinfoWait(input, locale);
    return unlicensedWait(input, locale);
  }
  const forecast = matchForecast(
    input.forecast,
    input.eta,
    input.timeZone ?? "Europe/Sofia"
  );
  const w = catalog(locale).planner.wait;

  if (forecast) {
    return finish(
      {
        source: "forecast",
        minutes: forecast.minutes,
        metric: "wait_min",
        quality: null,
        queueNow: forecast.queue,
        observedAt: forecast.at,
        ageMin: ageMinutes(forecast.at, input.now),
        label: w.forecastArrival,
      },
      locale
    );
  }

  const typical = matchDayStats(input.dayStats, input.eta);
  if (typical != null) {
    return finish(
      {
        source: "day_stats",
        minutes: typical.minutes,
        metric: "typical_queue",
        quality: input.dayStats?.quality ?? null,
        queueNow: null,
        observedAt: input.dayStats?.generatedAt ?? null,
        ageMin: ageMinutes(input.dayStats?.generatedAt ?? null, input.now),
        label:
          input.dayStats?.quality === "low" ? w.dayStatsLow : w.dayStats,
      },
      locale
    );
  }

  if (
    input.current &&
    (input.current.waitMin != null || input.current.queueNow != null)
  ) {
    const minutes = input.current.waitMin ?? input.current.queueNow ?? 0;
    return finish(
      {
        source: "current",
        minutes,
        metric: input.current.waitMin != null ? "wait_min" : "typical_queue",
        quality: input.current.quality,
        queueNow: input.current.queueNow,
        observedAt: input.current.observedAt,
        ageMin:
          input.current.ageMin ??
          ageMinutes(input.current.observedAt, input.now),
        label:
          input.current.quality === "low" ? w.currentLow : w.currentCache,
      },
      locale
    );
  }

  if (input.hatarinfo) return hatarinfoWait(input, locale);

  const local = localTypicalMinutes(
    input.localTypical,
    input.eta,
    input.timeZone ?? "Europe/Sofia"
  );
  if (local != null) {
    return {
      source: "local_typical",
      estimate: true,
      minutes: local,
      metric: "wait_min",
      quality: null,
      queue_now: null,
      observed_at: null,
      age_min: null,
      age_label: formatAge(null, locale),
      label_bg: w.localTypical,
      attribution: null,
    };
  }

  return {
    source: "unavailable",
    estimate: true,
    minutes: 0,
    metric: "none",
    quality: null,
    queue_now: null,
    observed_at: null,
    age_min: null,
    age_label: formatAge(null, locale, w.noData),
    label_bg: w.noWaitData,
    attribution: null,
  };
}

function hatarinfoWait(input: ExpectedWaitInput, locale: Locale): WaitEstimate {
  const w = catalog(locale).planner.wait;
  const reading = input.hatarinfo!;
  const traffic = trafficDelay(input);
  const band =
    reading.band === "under_15"
      ? w.hatarinfoUnder15
      : formatTemplate(w.hatarinfoMinutes, {
          minutes: String(Math.round(reading.minutes)),
        });
  const age = ageMinutes(reading.observedAt, input.now);
  return {
    source: "hatarinfo",
    estimate: true,
    minutes: Math.max(0, Math.round(reading.minutes)),
    metric: "wait_min",
    quality: null,
    queue_now: null,
    observed_at: reading.observedAt,
    age_min: age,
    age_label: formatAge(age, locale),
    label_bg: `${band}${w.hatarinfoDisclaimer}`,
    attribution: HATARINFO_ATTRIBUTION,
    traffic_delay_min: traffic,
  };
}

function trafficDelay(input: ExpectedWaitInput): number | null {
  if (input.trafficDelayMin == null || input.trafficDelayMin <= 0) return null;
  return Math.round(input.trafficDelayMin);
}

function unlicensedWait(input: ExpectedWaitInput, locale: Locale): WaitEstimate {
  const w = catalog(locale).planner.wait;
  const local = localTypicalMinutes(
    input.localTypical,
    input.eta,
    input.timeZone ?? "Europe/Sofia"
  );
  const traffic =
    input.trafficDelayMin != null && input.trafficDelayMin > 0
      ? Math.round(input.trafficDelayMin)
      : null;
  const trafficNote =
    traffic == null
      ? ""
      : formatTemplate(w.tomtomDelay, { minutes: String(traffic) });
  if (local != null) {
    return {
      source: "local_typical",
      estimate: true,
      minutes: local,
      metric: "wait_min",
      quality: null,
      queue_now: null,
      observed_at: null,
      age_min: null,
      age_label: formatAge(null, locale, w.noNakordoniObservation),
      label_bg: formatTemplate(w.unlicensedTable, { traffic: trafficNote }),
      attribution: null,
      unlicensed_market: true,
      traffic_delay_min: traffic,
    };
  }
  return {
    source: "unavailable",
    estimate: true,
    minutes: 0,
    metric: "none",
    quality: null,
    queue_now: null,
    observed_at: null,
    age_min: null,
    age_label: formatAge(null, locale, w.noData),
    label_bg: formatTemplate(w.unlicensedNoData, { traffic: trafficNote }),
    attribution: null,
    unlicensed_market: true,
    traffic_delay_min: traffic,
  };
}

function finish(
  input: {
    source: WaitSource;
    minutes: number;
    metric: WaitEstimate["metric"];
    quality: "high" | "low" | null;
    queueNow: number | null;
    observedAt: string | null;
    ageMin: number | null;
    label: string;
  },
  locale: Locale
): WaitEstimate {
  const age =
    input.ageMin == null ? null : Math.max(0, Math.round(input.ageMin));
  return {
    source: input.source,
    estimate: true,
    minutes: Math.max(0, Math.round(input.minutes)),
    metric: input.metric,
    quality: input.quality,
    queue_now: input.queueNow == null ? null : Math.round(input.queueNow),
    observed_at: input.observedAt,
    age_min: age,
    age_label: formatAge(age, locale),
    label_bg: input.label,
    attribution: NAKORDONI_ATTRIBUTION,
  };
}

export function formatAge(
  ageMin: number | null,
  locale: Locale = "bg",
  unknownOverride?: string
): string {
  const a = catalog(locale).planner.age;
  if (ageMin == null) return unknownOverride ?? a.unknown;
  if (ageMin < 2) return a.under2;
  if (ageMin < 60) {
    return formatTemplate(a.minutes, { minutes: String(ageMin) });
  }
  const hours = Math.round(ageMin / 60);
  if (hours < 48) {
    return formatTemplate(a.hours, { hours: String(hours) });
  }
  const days = Math.round(hours / 24);
  return formatTemplate(a.days, { days: String(days) });
}

function matchForecast(
  points: ForecastPoint[] | null,
  eta: Date,
  timeZone: string
): { minutes: number; at: string | null; queue: number | null } | null {
  if (!points || points.length === 0) return null;
  const etaMs = eta.getTime();
  let best: { delta: number; point: ForecastPoint } | null = null;
  for (const point of points) {
    if (point.waitMin == null && point.queue == null) continue;
    if (point.at) {
      const delta = Math.abs(new Date(point.at).getTime() - etaMs);
      if (!Number.isFinite(delta)) continue;
      if (!best || delta < best.delta) best = { delta, point };
    }
  }
  if (best && best.delta <= FORECAST_WINDOW_MS) {
    const minutes = best.point.waitMin ?? best.point.queue ?? 0;
    return { minutes, at: best.point.at, queue: best.point.queue };
  }

  const hour = zonedHour(eta, timeZone);
  const byHour = points.find(
    (point) => point.hour === hour && point.waitMin != null
  );
  if (!byHour || byHour.waitMin == null) return null;
  return { minutes: byHour.waitMin, at: byHour.at, queue: byHour.queue };
}

function matchDayStats(
  stats: DayStatsMatrix | null,
  eta: Date
): { minutes: number } | null {
  if (!stats) return null;
  const parts = zonedParts(eta, stats.timeZone || "Europe/Sofia");
  if (!parts) return null;
  const row = stats.matrix[parts.dow];
  const cell = row?.[parts.hour];
  if (typeof cell !== "number" || !Number.isFinite(cell)) return null;
  return { minutes: cell };
}

function ageMinutes(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const ms = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.round(ms / 60_000));
}

const WEEKDAYS: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** Local-hour index into `typical_wait_minutes`, Europe/Sofia by default. */
export function localTypicalMinutes(
  table: number[] | null,
  at: Date,
  timeZone = "Europe/Sofia"
): number | null {
  if (!table || table.length < 24) return null;
  const hour = zonedParts(at, timeZone)?.hour;
  if (hour == null) return null;
  const value = table[hour];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

/** Rounded local hour label for wait subtitles (e.g. 14:00). */
export function formatZonedHourLabel(
  at: Date,
  timeZone = "Europe/Sofia"
): string {
  const hour = zonedParts(at, timeZone)?.hour;
  if (hour == null) return "";
  return `${String(hour).padStart(2, "0")}:00`;
}

export function zonedParts(
  date: Date,
  timeZone: string
): { dow: number; hour: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
    const hourRaw = parts.find((part) => part.type === "hour")?.value ?? "";
    const dow = WEEKDAYS[weekday];
    let hour = Number(hourRaw);
    if (hour === 24) hour = 0;
    if (dow == null || !Number.isInteger(hour) || hour < 0 || hour > 23)
      return null;
    return { dow, hour };
  } catch {
    return null;
  }
}

function zonedHour(date: Date, timeZone: string): number {
  return zonedParts(date, timeZone)?.hour ?? date.getUTCHours();
}
