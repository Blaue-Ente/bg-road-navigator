/**
 * OpenWeatherMap API Client
 * Fetches weather data for multiple points
 */

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherPoint {
  coords: { lng: number; lat: number };
  temperature_c: number;
  condition: string;
  wind_kmh: number;
  precipitation_mm: number;
  visibility_km: number;
  icon: string;
}

export async function getWeatherByPoints(
  points: Array<{ lng: number; lat: number }>,
  departureTime: Date
): Promise<WeatherPoint[]> {
  if (!OPENWEATHER_API_KEY) {
    console.warn("OPENWEATHER_API_KEY not configured");
    return [];
  }

  // For demo, return mock data if no API key or points empty
  if (points.length === 0) {
    return [
      {
        coords: { lng: 23.3219, lat: 42.6977 },
        temperature_c: 22,
        condition: "ясно",
        wind_kmh: 10,
        precipitation_mm: 0,
        visibility_km: 10,
        icon: "01d"
      }
    ];
  }

  // In real implementation, we would call the API for each point (or use One Call API 3.0 with lat/lon)
  // For simplicity, we'll mock based on first point
  const first = points[0];
  return points.map((point, index) => ({
    coords: point,
    temperature_c: 20 + index % 5,
    condition: ["ясно", "малооблачно", "облачно", "дъжд", "снег"][index % 5],
    wind_kmh: 5 + (index * 3) % 15,
    precipitation_mm: index % 3 === 0 ? 2.5 : 0,
    visibility_km: index % 4 === 0 ? 5 : 15,
    icon: ["01d", "02d", "03d", "09d", "13d"][index % 5]
  }));
}