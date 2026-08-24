import type { EVStation } from "@/types/fuel.types";

const BASE_URL = "https://api.openchargemap.io/v3";
const SEARCH_TIMEOUT_MS = 8_000;

export interface OpenChargeConnection {
  PowerKW?: number;
  ConnectionTypeID?: number;
  ConnectionType?: { Title?: string };
}

export interface OpenChargePoi {
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

/** Common OCM connection IDs — used when compact payloads omit titles. */
const CONNECTION_TYPE_LABELS: Record<number, string> = {
  1: "Type 1",
  2: "CHAdeMO",
  25: "Type 2",
  32: "CCS (Type 1)",
  33: "CCS (Type 2)",
  1036: "Type 2",
  13: "Europlug",
  1038: "Type 2",
};

function openChargeApiKey(): string | undefined {
  const key = process.env.OPENCHARGE_API_KEY?.trim();
  return key || undefined;
}

function connectionLabel(connection: OpenChargeConnection): string | null {
  const title = connection.ConnectionType?.Title?.trim();
  if (title) return title;
  if (connection.ConnectionTypeID != null) {
    return CONNECTION_TYPE_LABELS[connection.ConnectionTypeID] ?? null;
  }
  return null;
}

function mapAvailability(
  status?: OpenChargePoi["StatusType"]
): EVStation["availability"] {
  if (status?.IsOperational === false) return "unavailable";
  return "unknown";
}

/** Maps a live OpenChargeMap POI list to app EV stations. */
export function mapOpenChargeStations(payload: unknown): EVStation[] {
  if (!Array.isArray(payload)) return [];

  return (payload as OpenChargePoi[]).flatMap((station) => {
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
          .map(connectionLabel)
          .filter((type): type is string => Boolean(type))
      )
    );
    const maxPower = Math.max(
      0,
      ...connections.map((connection) => connection.PowerKW ?? 0)
    );
    const addressLabel = [address.AddressLine1, address.Town]
      .filter(Boolean)
      .join(", ");

    return [
      {
        id: `ocm-${station.ID}`,
        name: address.Title ?? "EV зарядна станция",
        operator: station.OperatorInfo?.Title ?? "Неизвестен оператор",
        coords: { lng: stationLng, lat: stationLat },
        address: addressLabel,
        power_kw: maxPower,
        connector_types: connectorTypes,
        availability: mapAvailability(station.StatusType),
        price_kwh: null,
        distance_km: address.Distance ?? 0,
      },
    ];
  });
}

export async function getEVStations(
  lng?: number,
  lat?: number,
  radius_km: number = 10
): Promise<EVStation[]> {
  const apiKey = openChargeApiKey();
  if (!apiKey || lng === undefined || lat === undefined) return [];

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    distance: String(radius_km),
    distanceunit: "KM",
    maxresults: "50",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}/poi/?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BG-Road-Navigator/1.0 (travel planning)",
        "X-API-Key": apiKey,
      },
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];

    return mapOpenChargeStations(await response.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
