import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reverseEuropeanPlace } from "@/lib/api-clients/nominatim";
import { findNearestCity } from "@/lib/constants/european-cities";
import type { RoutePoint } from "@/types/route.types";

const QuerySchema = z.object({
  lat: z.coerce.number().finite().min(34).max(72),
  lng: z.coerce.number().finite().min(-25).max(45),
});

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    lat: request.nextUrl.searchParams.get("lat"),
    lng: request.nextUrl.searchParams.get("lng"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "lat and lng must be a point in Europe." },
      { status: 400 }
    );
  }

  const { lat, lng } = parsed.data;
  const geocoded = await reverseEuropeanPlace(lat, lng);
  if (geocoded) {
    return NextResponse.json({ place: geocoded });
  }

  const nearby = findNearestCity({ lat, lng }, 120);
  const place: RoutePoint = nearby
    ? {
        id: nearby.id,
        label: nearby.label,
        subtitle: nearby.country,
        coords: { lng, lat },
        source: "user",
      }
    : {
        id: `gps:${lat.toFixed(4)},${lng.toFixed(4)}`,
        label: "Моята локация",
        subtitle: `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
        coords: { lng, lat },
        source: "user",
      };

  return NextResponse.json({ place });
}
