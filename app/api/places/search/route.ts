import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchPlaces } from "@/lib/api-clients/geocoding";

const QuerySchema = z.object({
  q: z.string().trim().min(3).max(120),
});

function optionalCoord(
  raw: string | null,
  min: number,
  max: number
): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return undefined;
  return value;
}

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Search query must contain 3 to 120 characters." },
      { status: 400 }
    );
  }

  const places = await searchPlaces(parsed.data.q, {
    lat: optionalCoord(request.nextUrl.searchParams.get("lat"), -90, 90),
    lon: optionalCoord(request.nextUrl.searchParams.get("lon"), -180, 180),
    zoom: optionalCoord(request.nextUrl.searchParams.get("zoom"), 0, 22),
    lang: request.nextUrl.searchParams.get("lang") ?? undefined,
  });
  return NextResponse.json({ places });
}
