import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWeatherByPoints } from "@/lib/api-clients/openweather";

const WeatherQuerySchema = z.object({
  points: z.string().optional(),
  departure_time: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pointsParam = searchParams.get("points");
    const departureTime = searchParams.get("departure_time");

    const parsed = WeatherQuerySchema.safeParse({ points: pointsParam, departure_time: departureTime });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    // Parse points: JSON array string
    let points: Array<{ lng: number; lat: number }> = [];
    if (pointsParam) {
      try {
        points = JSON.parse(pointsParam);
      } catch {
        return NextResponse.json(
          { error: "Invalid points JSON", code: "INVALID_POINTS" },
          { status: 400 }
        );
      }
    }

    const weatherData = await getWeatherByPoints(points, departureTime ? new Date(departureTime) : new Date());

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data", code: "WEATHER_FETCH_FAILED" },
      { status: 500 }
    );
  }
}