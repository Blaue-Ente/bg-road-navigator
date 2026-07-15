/**
 * OpenWeatherMap API Client
 */

import type { WeatherAlert, WeatherPoint } from "@/types/weather.types";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const MOUNTAIN_ALERTS: WeatherAlert[] = [
  {
    id: "shipka-snow",
    title: "Внимание: Шипка",
    description: "Възможен сняг и ледени участъци над 1000м надморска височина.",
    severity: "high",
    coords: { lng: 25.1, lat: 42.1 },
  },
  {
    id: "petrohan-wind",
    title: "Силен вятър: Петрохан",
    description: "Пориви до 70 км/ч — шофирайте внимателно.",
    severity: "medium",
    coords: { lng: 26.5, lat: 42.5 },
  },
];

export async function getWeatherByPoints(
  points: Array<{ lng: number; lat: number }>,
  _departureTime: Date
): Promise<{ points: WeatherPoint[]; alerts: WeatherAlert[] }> {
  if (points.length === 0) {
    return { points: [], alerts: [] };
  }

  if (OPENWEATHER_API_KEY) {
    try {
      const pointsData = await Promise.all(
        points.map(async (point) => {
          const url = `${BASE_URL}/weather?lat=${point.lat}&lon=${point.lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=bg`;
          const response = await fetch(url, { next: { revalidate: 1800 } });
          if (!response.ok) throw new Error("Weather fetch failed");
          const data = await response.json();
          return {
            coords: point,
            temperature_c: Math.round(data.main.temp),
            condition: data.weather[0]?.description ?? "неизвестно",
            wind_kmh: Math.round((data.wind?.speed ?? 0) * 3.6),
            precipitation_mm: data.rain?.["1h"] ?? data.snow?.["1h"] ?? 0,
            visibility_km: (data.visibility ?? 10000) / 1000,
            icon: data.weather[0]?.icon ?? "01d",
          } satisfies WeatherPoint;
        })
      );

      const alerts =
        pointsData.some((p) => p.temperature_c < 2 || p.precipitation_mm > 0)
          ? MOUNTAIN_ALERTS
          : [];

      return { points: pointsData, alerts };
    } catch (error) {
      console.error("OpenWeather API error:", error);
    }
  }

  const pointsData = points.map((point, index) => ({
    coords: point,
    temperature_c: 20 + (index % 5),
    condition: ["ясно", "малооблачно", "облачно", "дъжд", "сняг"][index % 5],
    wind_kmh: 5 + ((index * 3) % 15),
    precipitation_mm: index % 3 === 0 ? 2.5 : 0,
    visibility_km: index % 4 === 0 ? 5 : 15,
    icon: ["01d", "02d", "03d", "09d", "13d"][index % 5],
  }));

  return {
    points: pointsData,
    alerts: pointsData.some((p) => p.temperature_c < 5) ? MOUNTAIN_ALERTS : [],
  };
}
