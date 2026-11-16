import { NextRequest, NextResponse } from "next/server";
import { requestLocale } from "@/lib/i18n/request-locale";
import { catalog } from "@/lib/i18n/locale";
import { apiError } from "@/lib/api/api-errors";
import { EuropePointSchema } from "@/lib/server/geo-schema";
import { getWeatherByPoints } from "@/lib/api-clients/open-meteo";
import { nearbyPassNames } from "@/lib/utils/route-weather-points";

export async function GET(request: NextRequest) {
  try {
    const pointsParam = request.nextUrl.searchParams.get("points");

    if (!pointsParam) {
      return apiError(request, "invalidPoints", "INVALID_POINTS", 400);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(pointsParam);
    } catch {
      return apiError(request, "invalidPoints", "INVALID_POINTS", 400);
    }

    const parsed = EuropePointSchema.array().min(1).max(20).safeParse(raw);
    if (!parsed.success) {
      return apiError(request, "invalidPoints", "INVALID_POINTS", 400);
    }

    const locale = requestLocale(request);
    const weatherData = await getWeatherByPoints(parsed.data, locale);

    const passes = nearbyPassNames(parsed.data, 35, locale);

    return NextResponse.json({
      ...weatherData,
      nearby_passes: passes,
      attribution: catalog(requestLocale(request)).api.weatherAttribution,
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return apiError(request, "weatherFetchFailed", "WEATHER_FETCH_FAILED", 500);
  }
}
