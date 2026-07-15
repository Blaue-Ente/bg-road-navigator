import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEVStations } from "@/lib/api-clients/opencharge";
import { getFuelStations } from "@/lib/api-clients/tomtom-places";
import type { FuelApiResponse } from "@/types/fuel.types";

const FuelQuerySchema = z.object({
  w: z.coerce.number().optional(),
  s: z.coerce.number().optional(),
  e: z.coerce.number().optional(),
  n: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = FuelQuerySchema.safeParse({
      w: searchParams.get("w"),
      s: searchParams.get("s"),
      e: searchParams.get("e"),
      n: searchParams.get("n"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    const centerLng = parsed.data.w && parsed.data.e
      ? (parsed.data.w + parsed.data.e) / 2
      : 23.32;
    const centerLat = parsed.data.s && parsed.data.n
      ? (parsed.data.s + parsed.data.n) / 2
      : 42.7;

    const [fuelStations, evStations] = await Promise.all([
      getFuelStations(centerLng, centerLat),
      getEVStations(centerLng, centerLat),
    ]);

    const response: FuelApiResponse = {
      fuelStations,
      evStations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Fuel API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel data", code: "FUEL_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
