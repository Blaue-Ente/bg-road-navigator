import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEmergencyPlaces } from "@/lib/api-clients/overpass";
import { haversineKm } from "@/lib/geo/haversine";
import { EuropePointSchema } from "@/lib/server/geo-schema";

export async function GET(request: NextRequest) {
  const parsed = EuropePointSchema.safeParse({
    lng: Number(request.nextUrl.searchParams.get("lng")),
    lat: Number(request.nextUrl.searchParams.get("lat")),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid lng/lat in Europe required", code: "INVALID_COORDS" },
      { status: 400 }
    );
  }

  const places = await fetchNearbyEmergencyPlaces(
    parsed.data.lng,
    parsed.data.lat
  );
  const withDistance = places
    .map((place) => ({
      ...place,
      distance_km: Math.round(haversineKm(parsed.data, place.coords) * 10) / 10,
    }))
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

  return NextResponse.json({
    origin: parsed.data,
    places: withDistance,
    degraded: withDistance.length === 0,
    source: "openstreetmap-overpass",
    disclaimer_bg:
      "Данни от OpenStreetMap — може да не са пълни или в реално време.",
  });
}
