import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import type { SleepShift } from "@/lib/planner/breaks";
import { wallClockEta } from "@/lib/planner/breaks";
import { pointAtDistance, lineLengthKm } from "@/lib/planner/line";
import type { RouteWeather, RouteWeatherWarning } from "@/lib/planner/types";
import { wmoToWeather } from "@/lib/utils/weather-codes";
import { catalog, type Locale } from "@/lib/i18n/locale";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ALARM_URL = "https://api.meteoalarm.org/v1/warnings";
const FORECAST_TIMEOUT_MS = 4_000;
const ALARM_TIMEOUT_MS = 2_500;

interface Hourly {
  time?: string[];
  temperature_2m?: number[];
  weather_code?: number[];
  wind_speed_10m?: number[];
  precipitation?: number[];
}

export async function weatherAlongRoute(input: {
  locale?: Locale;
  line: Array<[number, number]>;
  departAt: Date;
  durationMin: number;
  distanceKm: number;
  borderAlongKm?: number | null;
  borderWaitMin?: number;
  sleepShifts?: SleepShift[];
  fetchImpl?: typeof fetch;
}): Promise<RouteWeather> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const hourlyEmpty = catalog(input.locale ?? "bg").planner.weather.hourlyEmpty;
  const samples = samplePoints(input);
  const empty: RouteWeather = {
    segments: samples.map((sample) => ({
      ...sample,
      temperature_c: null,
      weather_code: null,
      wind_kmh: null,
      precipitation_mm: null,
      summary_bg: "Няма прогноза за този час.",
    })),
    warnings: [],
    attribution: "Прогноза: Open-Meteo.com (CC BY 4.0)",
  };
  if (samples.length === 0) return empty;

  const [forecast, alarms] = await Promise.all([
    fetchForecast(samples, fetchImpl),
    fetchAlarms(samples, fetchImpl),
  ]);

  const segments = samples.map((sample, index) => {
    const block = forecast[index];
    const hour = block ? hourIndex(block.hourly, sample.eta) : -1;
    const code = at(block?.hourly.weather_code, hour);
    const temperature = at(block?.hourly.temperature_2m, hour);
    const wind = at(block?.hourly.wind_speed_10m, hour);
    const rain = at(block?.hourly.precipitation, hour);
    const summary =
      code == null
        ? hourlyEmpty
        : `${wmoToWeather(code).condition}${
            temperature == null ? "" : `, ${Math.round(temperature)}°C`
          }`;
    return {
      ...sample,
      temperature_c: temperature == null ? null : Math.round(temperature),
      weather_code: code,
      wind_kmh: wind == null ? null : Math.round(wind),
      precipitation_mm: rain,
      summary_bg: summary,
    };
  });

  const warnings = [...alarms];
  for (const segment of segments) {
    const severe = warningFromCode(segment.weather_code);
    if (!severe) continue;
    warnings.push({
      source: "open-meteo",
      severity: severe,
      title: segment.summary_bg,
      detail: `Около ${segment.distance_from_start_km} км по маршрута в ${segment.eta}.`,
      country_code: countryCodeAtPoint(segment.lng, segment.lat),
    });
  }

  return { segments, warnings, attribution: empty.attribution };
}

function samplePoints(input: {
  line: Array<[number, number]>;
  departAt: Date;
  durationMin: number;
  distanceKm: number;
  borderAlongKm?: number | null;
  borderWaitMin?: number;
  sleepShifts?: SleepShift[];
}) {
  const geometryKm = lineLengthKm(input.line);
  if (geometryKm <= 0) return [];
  const fractions = [0, 0.35, 0.7, 1];
  const sleepShifts = input.sleepShifts ?? [];
  const borderWaitMin = input.borderWaitMin ?? 0;
  return fractions.map((fraction) => {
    const roadKm = input.distanceKm * fraction;
    const point = pointAtDistance(input.line, geometryKm * fraction);
    const drivingMin = fraction * input.durationMin;
    const wait =
      input.borderAlongKm != null && roadKm >= input.borderAlongKm - 1
        ? borderWaitMin
        : 0;
    const eta = wallClockEta({
      departAt: input.departAt,
      drivingMin,
      extraWaitMin: wait,
      sleepShifts,
    });
    return {
      eta: eta.toISOString(),
      lat: Math.round(point.lat * 10_000) / 10_000,
      lng: Math.round(point.lng * 10_000) / 10_000,
      distance_from_start_km: Math.round(roadKm),
    };
  });
}

async function fetchForecast(
  samples: Array<{ lat: number; lng: number }>,
  fetchImpl: typeof fetch
): Promise<Array<{ hourly: Hourly } | null>> {
  const params = new URLSearchParams({
    latitude: samples.map((sample) => sample.lat).join(","),
    longitude: samples.map((sample) => sample.lng).join(","),
    hourly: "temperature_2m,weather_code,wind_speed_10m,precipitation",
    forecast_days: "7",
    timezone: "UTC",
  });
  try {
    const response = await fetchImpl(`${FORECAST_URL}?${params}`, {
      signal: AbortSignal.timeout(FORECAST_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return samples.map(() => null);
    const payload = (await response.json()) as { hourly?: Hourly } | Array<{ hourly?: Hourly }>;
    const blocks = Array.isArray(payload) ? payload : [payload];
    return samples.map((_, index) => {
      const hourly = blocks[index]?.hourly;
      return hourly ? { hourly } : null;
    });
  } catch {
    return samples.map(() => null);
  }
}

async function fetchAlarms(
  samples: Array<{ lat: number; lng: number }>,
  fetchImpl: typeof fetch
): Promise<RouteWeatherWarning[]> {
  const countries = [
    ...new Set(
      samples
        .map((sample) => countryCodeAtPoint(sample.lng, sample.lat))
        .filter((code): code is string => Boolean(code))
    ),
  ].slice(0, 4);
  const batches = await Promise.all(
    countries.map(async (country) => {
      try {
        const response = await fetchImpl(
          `${ALARM_URL}?country=${encodeURIComponent(country)}`,
          {
            signal: AbortSignal.timeout(ALARM_TIMEOUT_MS),
            headers: { Accept: "application/json" },
          }
        );
        if (!response.ok) return [];
        return parseAlarms(await response.json(), country);
      } catch {
        return [];
      }
    })
  );
  return batches.flat().slice(0, 6);
}

export function parseAlarms(
  payload: unknown,
  country: string
): RouteWeatherWarning[] {
  const rows = Array.isArray(payload)
    ? payload
    : ((payload as { warnings?: unknown[] } | null)?.warnings ?? []);
  if (!Array.isArray(rows)) return [];
  const warnings: RouteWeatherWarning[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as {
      event?: unknown;
      title?: unknown;
      severity?: unknown;
      description?: unknown;
      detail?: unknown;
    };
    const title = stringOf(record.event) ?? stringOf(record.title);
    if (!title) continue;
    warnings.push({
      source: "meteoalarm",
      severity: alarmSeverity(stringOf(record.severity)),
      title,
      detail: stringOf(record.description) ?? stringOf(record.detail) ?? title,
      country_code: country,
    });
  }
  return warnings;
}

function alarmSeverity(value: string | null): RouteWeatherWarning["severity"] {
  const text = (value ?? "").toLowerCase();
  if (text.includes("extreme") || text.includes("severe") || text.includes("red")) {
    return "severe";
  }
  if (text.includes("moderate") || text.includes("orange")) return "moderate";
  return "minor";
}

function warningFromCode(code: number | null): RouteWeatherWarning["severity"] | null {
  if (code == null) return null;
  if (code >= 95 || code === 66 || code === 67 || code >= 75) return "severe";
  if (code >= 71 || code >= 65 || code === 82) return "moderate";
  return null;
}

function hourIndex(hourly: Hourly | undefined, etaIso: string): number {
  const times = hourly?.time ?? [];
  if (times.length === 0) return -1;
  const eta = new Date(etaIso).getTime();
  let best = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < times.length; i++) {
    const stamp = new Date(times[i] ?? "").getTime();
    const delta = Math.abs(stamp - eta);
    if (delta < bestDelta) {
      best = i;
      bestDelta = delta;
    }
  }
  return best;
}

function at(values: number[] | undefined, index: number): number | null {
  if (!values || index < 0) return null;
  const value = values[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
