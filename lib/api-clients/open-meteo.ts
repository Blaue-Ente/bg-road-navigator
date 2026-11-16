/**
 * Open-Meteo API — free, no API key required
 * @see https://github.com/open-meteo/open-meteo
 */

import type { WeatherAlert, WeatherPoint } from "@/types/weather.types";
import { wmoToWeather } from "@/lib/utils/weather-codes";
import { nearbyPassNames } from "@/lib/i18n/locales/weather-mountain-passes";
import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoLocation {
  latitude: number;
  longitude: number;
  current?: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    precipitation: number;
    visibility: number;
  };
}

function buildAlerts(
  points: WeatherPoint[],
  coords: Array<{ lng: number; lat: number }>,
  locale: Locale
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const w = catalog(locale).planner.weather;
  const winterish = points.some(
    (p) => p.temperature_c < 2 || p.precipitation_mm > 0
  );
  if (winterish) {
    for (const name of nearbyPassNames(coords, 35, locale)) {
      alerts.push({
        id: `pass-${name}`,
        title: formatTemplate(w.alertPassTitle, { name }),
        description: w.alertPassDescription,
        severity: "high",
      });
    }
  }

  if (points.some((p) => p.wind_kmh > 50)) {
    alerts.push({
      id: "high-wind",
      title: w.alertHighWindTitle,
      description: w.alertHighWindDescription,
      severity: "medium",
    });
  }

  if (points.some((p) => p.visibility_km < 2)) {
    alerts.push({
      id: "low-visibility",
      title: w.alertLowVisibilityTitle,
      description: w.alertLowVisibilityDescription,
      severity: "high",
    });
  }

  return alerts;
}

export async function getWeatherByPoints(
  points: Array<{ lng: number; lat: number }>,
  locale: Locale = "bg"
): Promise<{ points: WeatherPoint[]; alerts: WeatherAlert[] }> {
  if (points.length === 0) {
    return { points: [], alerts: [] };
  }

  const limited = points.slice(0, 20);
  const latitudes = limited.map((p) => p.lat).join(",");
  const longitudes = limited.map((p) => p.lng).join(",");

  const params = new URLSearchParams({
    latitude: latitudes,
    longitude: longitudes,
    current:
      "temperature_2m,weather_code,wind_speed_10m,precipitation,visibility",
    timezone: "Europe/Sofia",
  });

  try {
    const response = await fetch(`${FORECAST_URL}?${params}`, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}`);
    }

    const payload = await response.json();
    const locations: OpenMeteoLocation[] = Array.isArray(payload)
      ? payload
      : [payload];

    const pointsData: WeatherPoint[] = locations.map((loc, index) => {
      const requested = limited[index] ?? {
        lat: loc.latitude,
        lng: loc.longitude,
      };
      const current = loc.current;
      const wmo = wmoToWeather(current?.weather_code ?? 0);

      return {
        coords: requested,
        temperature_c: Math.round(current?.temperature_2m ?? 0),
        condition: wmo.condition,
        wind_kmh: Math.round(current?.wind_speed_10m ?? 0),
        precipitation_mm: current?.precipitation ?? 0,
        visibility_km: Math.round((current?.visibility ?? 10000) / 100) / 10,
        icon: wmo.icon,
      };
    });

    return {
      points: pointsData,
      alerts: buildAlerts(pointsData, limited, locale),
    };
  } catch (error) {
    console.error("Open-Meteo API error:", error);
    throw error;
  }
}