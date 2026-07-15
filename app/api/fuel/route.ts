import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEVStations } from "@/lib/api-clients/opencharge";
import type { FuelApiResponse, FuelStation } from "@/types/fuel.types";

const FuelQuerySchema = z.object({
  w: z.coerce.number().optional(),
  s: z.coerce.number().optional(),
  e: z.coerce.number().optional(),
  n: z.coerce.number().optional(),
});

const MOCK_FUEL_STATIONS: FuelStation[] = [
  {
    id: "fuel-1",
    name: "Total Sofia Center",
    brand: "Total",
    coords: { lng: 23.3219, lat: 42.6977 },
    address: "бул. Витоша 15, София",
    prices: {
      diesel: 2.85,
      petrol95: 2.68,
      petrol98: 2.95,
      lpg: 1.45,
      adblue: 2.1,
    },
    open: true,
    distance_km: 5.2,
    payment_methods: ["Налично", "Карта"],
  },
  {
    id: "fuel-2",
    name: "Lukoil Plovdiv",
    brand: "Lukoil",
    coords: { lng: 24.7453, lat: 42.1354 },
    address: "Марица, Пловдив",
    prices: {
      diesel: 2.8,
      petrol95: 2.65,
      petrol98: 2.9,
      lpg: 1.42,
      adblue: 2.05,
    },
    open: true,
    distance_km: 12.8,
    payment_methods: ["Карта", "Apple Pay"],
  },
  {
    id: "fuel-3",
    name: "OMV Kalotina",
    brand: "OMV",
    coords: { lng: 22.9, lat: 42.98 },
    address: "Калотина, до границата",
    prices: {
      diesel: 2.92,
      petrol95: 2.75,
      lpg: 1.48,
    },
    open: true,
    distance_km: 2.1,
    payment_methods: ["Налично", "Карта", "Euro"],
  },
];

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

    const evStations = await getEVStations(centerLng, centerLat);

    const response: FuelApiResponse = {
      fuelStations: MOCK_FUEL_STATIONS,
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
