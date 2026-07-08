/**
 * OpenChargeMap API Client
 * Fetches EV charging station data
 */

const OPENCHARGE_API_KEY = process.env.OPENCHARGE_API_KEY;
const BASE_URL = "https://api.openchargemap.io/v2";

export interface EVStation {
  id: string;
  operator: string;
  coords: { lng: number; lat: number };
  power_kw: number;
  connector_types: string[];
  available: boolean;
  price_kwh: number | null;
  distance_km: number;
  name: string;
  address: string;
}

export async function getEVStations(
  lng?: number,
  lat?: number,
  radius_km: number = 10,
  connector_types: string[] = []
): Promise<EVStation[]> {
  if (!OPENCHARGE_API_KEY) {
    console.warn("OPENCHARGE_API_KEY not configured");
    return [];
  }

  // Mock implementation for now
  return [
    {
      id: "ev-1",
      operator: "Fastned",
      coords: { lng: 23.3219, lat: 42.6977 },
      power_kw: 150,
      connector_types: ["Type2", "CCS"],
      available: true,
      price_kwh: 0.45,
      distance_km: 0.5,
      name: "Fastned Sofia Center",
      address: "Sofia, Bulgaria"
    },
    {
      id: "ev-2",
      operator: "Tesla",
      coords: { lng: 26.4791, lat: 42.6619 },
      power_kw: 250,
      connector_types: ["Tesla", "CCS"],
      available: true,
      price_kwh: 0.48,
      distance_km: 8.2,
      name: "Tesla Sofia North",
      address: "Sofia, Bulgaria"
    }
  ];
}