import { cachedValue, minutesFromEnv, snapToGrid } from "@/lib/cache/shared-cache";
import { haversineKm } from "@/lib/geo/haversine";
import type { EVStation } from "@/types/fuel.types";

const BASE_URL = "https://api.openchargemap.io/v2";

interface OpenChargeConnection {
  PowerKW?: number;
  ConnectionType?: { Title?: string };
}

interface OpenChargePoi {
  ID: number;
  AddressInfo?: {
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    Latitude?: number;
    Longitude?: number;
    Distance?: number;
  };
  OperatorInfo?: { Title?: string };
  StatusType?: { IsOperational?: boolean };
  Connections?: OpenChargeConnection[];
}

/** Cells of about 5 km: drivers on similar routes share one stored answer. */
const CELL_DEG = 0.05;
/** The cell centre can be this far from the real point. */
const CELL_MARGIN_KM = 4;

/**
 * Charging points near a point. OpenChargeMap is open data, so the answer is
 * kept (shared through the database) for OPENCHARGE_CACHE_MINUTES, default 6 h;
 * distances are recomputed from the real point afterwards.
 */
export async function getEVStations(
  lng?: number,
  lat?: number,
  radius_km: number = 10
): Promise<EVStation[]> {
  const key = process.env.OPENCHARGE_API_KEY?.trim();
  if (!key) return [];
  if (lng === undefined || lat === undefined) return [];

  const cellLng = snapToGrid(lng, CELL_DEG);
  const cellLat = snapToGrid(lat, CELL_DEG);
  const reach = Math.ceil(radius_km) + CELL_MARGIN_KM;
  const { value } = await cachedValue<EVStation[]>({
    key: `ocm|${cellLat.toFixed(2)}|${cellLng.toFixed(2)}|${reach}`,
    kind: "opencharge",
    ttlMs: minutesFromEnv(process.env.OPENCHARGE_CACHE_MINUTES, 360) * 60_000,
    persist: true,
    load: () => fetchEVStations(key, cellLng, cellLat, reach),
  });
  return (value ?? [])
    .map((station) => ({
      ...station,
      distance_km: Math.round(haversineKm({ lng, lat }, station.coords) * 10) / 10,
    }))
    .filter((station) => station.distance_km <= radius_km)
    .sort((a, b) => a.distance_km - b.distance_km);
}

/** One live call. Null when the service failed, so a failure is never kept. */
async function fetchEVStations(
  key: string,
  lng: number,
  lat: number,
  radius_km: number
): Promise<EVStation[] | null> {
  const params = new URLSearchParams({
    key,
    latitude: String(lat),
    longitude: String(lng),
    distance: String(radius_km),
    distanceunit: "KM",
    maxresults: "50",
    compact: "true",
    verbose: "false",
  });

  try {
    const response = await fetch(`${BASE_URL}/poi/?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const stations = (await response.json()) as OpenChargePoi[];
    return stations.flatMap((station) => {
      const address = station.AddressInfo;
      const stationLat = address?.Latitude;
      const stationLng = address?.Longitude;
      if (
        !address ||
        typeof stationLat !== "number" ||
        typeof stationLng !== "number"
      ) {
        return [];
      }

      const connections = station.Connections ?? [];
      const connectorTypes = Array.from(
        new Set(
          connections
            .map((connection) => connection.ConnectionType?.Title)
            .filter((type): type is string => Boolean(type))
        )
      );
      const maxPower = Math.max(
        0,
        ...connections.map((connection) => connection.PowerKW ?? 0)
      );
      const addressLabel = [address?.AddressLine1, address?.Town]
        .filter(Boolean)
        .join(", ");

      return [
        {
          id: `ocm-${station.ID}`,
          name: address.Title ?? "EV charging station",
          operator: station.OperatorInfo?.Title ?? "Unknown operator",
          coords: { lng: stationLng, lat: stationLat },
          address: addressLabel,
          power_kw: maxPower,
          connector_types: connectorTypes,
          availability: station.StatusType?.IsOperational
            ? "unknown"
            : "unavailable",
          price_kwh: null,
          distance_km: address.Distance ?? 0,
        },
      ];
    });
  } catch {
    return null;
  }
}
