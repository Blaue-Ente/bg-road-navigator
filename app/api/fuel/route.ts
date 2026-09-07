import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEVStations } from "@/lib/api-clients/opencharge";
import { getFuelStations } from "@/lib/api-clients/tomtom-places";
import { EuropeBboxSchema, EuropePointSchema } from "@/lib/server/geo-schema";
import {
  bboxFromCoordinates,
  sampleRouteCoordinates,
} from "@/lib/utils/route-fuel-sample";
import type {
  EVStation,
  FuelApiResponse,
  FuelStation,
} from "@/types/fuel.types";

const FuelQuerySchema = z.object({
  w: z.coerce.number().optional(),
  s: z.coerce.number().optional(),
  e: z.coerce.number().optional(),
  n: z.coerce.number().optional(),
  /** Compact polyline: "lng,lat;lng,lat;..." — samples along the route. */
  route: z.string().max(8_000).optional(),
});

function parseRouteParam(raw: string | undefined): Array<[number, number]> {
  if (!raw?.trim()) return [];
  return raw
    .split(";")
    .slice(0, 40)
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const [lngRaw, latRaw] = part.split(",");
      const parsed = EuropePointSchema.safeParse({
        lng: Number(lngRaw),
        lat: Number(latRaw),
      });
      if (!parsed.success) return [];
      return [[parsed.data.lng, parsed.data.lat] as [number, number]];
    });
}

function dedupeFuel(stations: FuelStation[]): FuelStation[] {
  const seen = new Set<string>();
  return stations.filter((s) => {
    const key = s.id || `${s.coords.lng.toFixed(4)},${s.coords.lat.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeEv(stations: EVStation[]): EVStation[] {
  const seen = new Set<string>();
  return stations.filter((s) => {
    const key = s.id || `${s.coords.lng.toFixed(4)},${s.coords.lat.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = FuelQuerySchema.safeParse({
      w: searchParams.get("w"),
      s: searchParams.get("s"),
      e: searchParams.get("e"),
      n: searchParams.get("n"),
      route: searchParams.get("route") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    const routeCoords = parseRouteParam(parsed.data.route);
    const hasKeys = Boolean(
      process.env.TOMTOM_API_KEY || process.env.OPENCHARGE_API_KEY
    );

    let fuelStations: FuelStation[] = [];
    let evStations: EVStation[] = [];
    let mode: "route" | "bbox" | "default" = "default";

    if (routeCoords.length >= 2) {
      mode = "route";
      const samples = sampleRouteCoordinates(routeCoords, 90, 6);
      const batches = await Promise.all(
        samples.map(async (point) => {
          const [fuel, ev] = await Promise.all([
            getFuelStations(point.lng, point.lat, 25),
            getEVStations(point.lng, point.lat, 25),
          ]);
          return { fuel, ev };
        })
      );
      fuelStations = dedupeFuel(batches.flatMap((b) => b.fuel));
      evStations = dedupeEv(batches.flatMap((b) => b.ev));
    } else {
      const bboxCandidate = {
        w: parsed.data.w,
        s: parsed.data.s,
        e: parsed.data.e,
        n: parsed.data.n,
      };
      const hasBbox =
        parsed.data.w !== undefined &&
        parsed.data.s !== undefined &&
        parsed.data.e !== undefined &&
        parsed.data.n !== undefined;
      if (hasBbox) {
        const bboxParsed = EuropeBboxSchema.safeParse(bboxCandidate);
        if (!bboxParsed.success) {
          return NextResponse.json(
            { error: "Invalid bbox", code: "INVALID_BBOX" },
            { status: 400 }
          );
        }
      }
      const centerLng =
        parsed.data.w !== undefined && parsed.data.e !== undefined
          ? (parsed.data.w + parsed.data.e) / 2
          : 23.32;
      const centerLat =
        parsed.data.s !== undefined && parsed.data.n !== undefined
          ? (parsed.data.s + parsed.data.n) / 2
          : 42.7;
      mode = hasBbox ? "bbox" : "default";

      [fuelStations, evStations] = await Promise.all([
        getFuelStations(centerLng, centerLat),
        getEVStations(centerLng, centerLat),
      ]);
    }

    const bbox =
      routeCoords.length >= 2
        ? bboxFromCoordinates(routeCoords)
        : parsed.data.w !== undefined &&
            parsed.data.s !== undefined &&
            parsed.data.e !== undefined &&
            parsed.data.n !== undefined
          ? {
              w: parsed.data.w,
              s: parsed.data.s,
              e: parsed.data.e,
              n: parsed.data.n,
            }
          : null;

    const response: FuelApiResponse = {
      fuelStations,
      evStations,
      degraded: !hasKeys,
      mode,
      bbox,
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
