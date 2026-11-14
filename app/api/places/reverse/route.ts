import { NextRequest, NextResponse } from "next/server";
import { reversePlace } from "@/lib/api-clients/geocoding";

/** Matches the search route so a cold Photon reverse can finish. */
export const maxDuration = 20;

function readCoord(
  raw: string | null,
  min: number,
  max: number
): number | null {
  if (raw == null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

export async function GET(request: NextRequest) {
  const lat = readCoord(request.nextUrl.searchParams.get("lat"), -90, 90);
  const lng = readCoord(
    request.nextUrl.searchParams.get("lng") ??
      request.nextUrl.searchParams.get("lon"),
    -180,
    180
  );

  if (lat == null || lng == null) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 }
    );
  }

  const place = await reversePlace(lat, lng, {
    lang: request.nextUrl.searchParams.get("lang") ?? undefined,
  });
  return NextResponse.json({ place });
}
