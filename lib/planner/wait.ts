import { HATARINFO_ATTRIBUTION } from "@/lib/constants/border-official-links";
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
}

const FORECAST_WINDOW_MS = 75 * 60 * 1000;

/**
 * Wait at the moment the driver reaches the crossing.
 * Forecast, then the typical weekday/hour, then the cached current queue,
 * then the local table. Missing data stays zero and says so.
 */
export function expectedWait(input: ExpectedWaitInput): WaitEstimate {
  if (input.licensed === false) {
    if (input.hatarinfo) return hatarinfoWait(input);
    return unlicensedWait(input);
  }
  const forecast = matchForecast(
    input.forecast,
    input.eta,
    input.timeZone ?? "Europe/Sofia"
  );
  if (forecast) {
    return finish({
      source: "forecast",
      minutes: forecast.minutes,
      metric: "wait_min",
      quality: null,
      queueNow: forecast.queue,
      observedAt: forecast.at,
      ageMin: ageMinutes(forecast.at, input.now),
      labelBg: "прогноза за часа на пристигане",
    });
  }

  const typical = matchDayStats(input.dayStats, input.eta);
  if (typical != null) {
    return finish({
      source: "day_stats",
      minutes: typical.minutes,
      metric: "typical_queue",
      quality: input.dayStats?.quality ?? null,
      queueNow: null,
      observedAt: input.dayStats?.generatedAt ?? null,
      ageMin: ageMinutes(input.dayStats?.generatedAt ?? null, input.now),
      labelBg:
        input.dayStats?.quality === "low"
          ? "типична медиана за този час, моделирана оценка"
          : "типична медиана за този ден и час",
    });
  }

  if (
    input.current &&
    (input.current.waitMin != null || input.current.queueNow != null)
  ) {
    const minutes = input.current.waitMin ?? input.current.queueNow ?? 0;
    return finish({
      source: "current",
      minutes,
      metric: input.current.waitMin != null ? "wait_min" : "typical_queue",
      quality: input.current.quality,
      queueNow: input.current.queueNow,
      observedAt: input.current.observedAt,
      ageMin:
        input.current.ageMin ?? ageMinutes(input.current.observedAt, input.now),
      labelBg:
        input.current.quality === "low"
          ? "текуща опашка, моделирана оценка"
          : "текуща опашка от кеша",
    });
  }

  if (input.hatarinfo) return hatarinfoWait(input);

  const hour = zonedHour(input.eta, input.timeZone ?? "Europe/Sofia");
  const local = input.localTypical?.[hour];
  if (typeof local === "number") {
    return {
      source: "local_typical",
      estimate: true,
      minutes: Math.round(local),
      metric: "wait_min",
      quality: null,
      queue_now: null,
      observed_at: null,
      age_min: null,
      age_label: "няма наблюдение от nakordoni",
      label_bg: "местна типична оценка, не е от nakordoni",
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
    age_label: "няма данни",
    label_bg: "няма данни за чакане",
    attribution: null,
  };
}

function hatarinfoWait(input: ExpectedWaitInput): WaitEstimate {
  const reading = input.hatarinfo!;
  const traffic = trafficDelay(input);
  const band =
    reading.band === "under_15"
      ? "Няма чакане над 15 мин за лек автомобил."
      : `Около ${Math.round(reading.minutes)} мин за лек автомобил.`;
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
    age_label: formatAge(age),
    label_bg: `${band} Показанието е ориентировъчно.`,
    attribution: HATARINFO_ATTRIBUTION,
    traffic_delay_min: traffic,
  };
}

function trafficDelay(input: ExpectedWaitInput): number | null {
  if (input.trafficDelayMin == null || input.trafficDelayMin <= 0) return null;
  return Math.round(input.trafficDelayMin);
}

function unlicensedWait(input: ExpectedWaitInput): WaitEstimate {
  const hour = zonedHour(input.eta, input.timeZone ?? "Europe/Sofia");
  const local = input.localTypical?.[hour];
  const traffic =
    input.trafficDelayMin != null && input.trafficDelayMin > 0
      ? Math.round(input.trafficDelayMin)
      : null;
  const trafficNote =
    traffic == null
      ? ""
      : ` TomTom отчита около ${traffic} мин задръстване наблизо.`;
  if (typeof local === "number") {
    return {
      source: "local_typical",
      estimate: true,
      minutes: Math.round(local),
      metric: "wait_min",
      quality: null,
      queue_now: null,
      observed_at: null,
      age_min: null,
      age_label: "няма наблюдение от nakordoni",
      label_bg: `Типично чакане от нашата таблица. Пунктът е извън лицензираните пазари на Nakordoni.${trafficNote}`,
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
    age_label: "няма данни",
    label_bg: `Няма данни за чакане. Пунктът е извън лицензираните пазари на Nakordoni.${trafficNote}`,
    attribution: null,
    unlicensed_market: true,
    traffic_delay_min: traffic,
  };
}

function finish(input: {
  source: WaitSource;
  minutes: number;
  metric: WaitEstimate["metric"];
  quality: "high" | "low" | null;
  queueNow: number | null;
  observedAt: string | null;
  ageMin: number | null;
  labelBg: string;
}): WaitEstimate {
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
    age_label: formatAge(age),
    label_bg: input.labelBg,
    attribution: NAKORDONI_ATTRIBUTION,
  };
}

export function formatAge(ageMin: number | null): string {
  if (ageMin == null) return "времето на наблюдение е неизвестно";
  if (ageMin < 2) return "наблюдение преди по-малко от 2 мин";
  if (ageMin < 60) return `наблюдение преди ${ageMin} мин`;
  const hours = Math.round(ageMin / 60);
  if (hours < 48) return `наблюдение преди ${hours} ч`;
  return `наблюдение преди ${Math.round(hours / 24)} д`;
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
