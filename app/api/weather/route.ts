import { NextRequest, NextResponse } from "next/server";
import { EuropePointSchema } from "@/lib/server/geo-schema";
import { getWeatherByPoints } from "@/lib/api-clients/open-meteo";
import { nearbyPassNames } from "@/lib/utils/route-weather-points";

export async function GET(request: NextRequest) {
  try {
    const pointsParam = request.nextUrl.searchParams.get("points");

    if (!pointsParam) {
      return NextResponse.json(
        { error: "Missing points", code: "INVALID_POINTS" },
        { status: 400 }
      );
    }

    let raw: unknown;
    try {
      raw = JSON.parse(pointsParam);
    } catch {
      return NextResponse.json(
        { error: "Invalid points JSON", code: "INVALID_POINTS" },
        { status: 400 }
      );
    }

    const parsed = EuropePointSchema.array().min(1).max(20).safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid points", code: "INVALID_POINTS" },
        { status: 400 }
      );
    }

    const weatherData = await getWeatherByPoints(parsed.data);

    const passes = nearbyPassNames(parsed.data);

    return NextResponse.json({
      ...weatherData,
      nearby_passes: passes,
      attribution: "Прогноза: Open-Meteo.com (CC BY 4.0)",
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data", code: "WEATHER_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
