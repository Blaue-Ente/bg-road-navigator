/**
 * Open-Meteo API — free, no API key required
 * @see https://github.com/open-meteo/open-meteo
 */

import type { WeatherAlert, WeatherPoint } from "@/types/weather.types";
import { wmoToWeather } from "@/lib/utils/weather-codes";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const MOUNTAIN_ALERTS: WeatherAlert[] = [
  {
    id: "shipka-snow",
    title: "Внимание: Шипка",
    description: "Възможен сняг и ледени участъци над 1000 m.",
    severity: "high",
    coords: { lng: 25.1, lat: 42.1 },
  },
  {
    id: "petrohan-wind",
    title: "Силен вятър: Петрохан",
    description: "Пориви до 70 km/h — шофирайте внимателно.",
    severity: "medium",
    coords: { lng: 26.5, lat: 42.5 },
  },
];

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

function buildAlerts(points: WeatherPoint[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (points.some((p) => p.temperature_c < 2 || p.precipitation_mm > 0)) {
    alerts.push(...MOUNTAIN_ALERTS);
  }

  if (points.some((p) => p.wind_kmh > 50)) {
    alerts.push({
      id: "high-wind",
      title: "Силен вятър по маршрута",
      description: "Вятър над 50 km/h — внимание при високи превозни средства.",
      severity: "medium",
    });
  }

  if (points.some((p) => p.visibility_km < 2)) {
    alerts.push({
      id: "low-visibility",
      title: "Намалена видимост",
      description: "Видимост под 2 km — включете светлините и намалете скоростта.",
      severity: "high",
    });
  }

  return alerts;
}

export async function getWeatherByPoints(
  points: Array<{ lng: number; lat: number }>,
  _departureTime?: Date
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
      alerts: buildAlerts(pointsData),
    };
  } catch (error) {
    console.error("Open-Meteo API error:", error);
    throw error;
  }
}
