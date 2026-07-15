import type { EVStation } from "@/types/fuel.types";

const OPENCHARGE_API_KEY = process.env.OPENCHARGE_API_KEY;
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

export async function getEVStations(
  lng?: number,
  lat?: number,
  radius_km: number = 10,
  connector_types: string[] = []
): Promise<EVStation[]> {
  if (!OPENCHARGE_API_KEY) {
    return [];
  }

  if (lng === undefined || lat === undefined) return [];

  const params = new URLSearchParams({
    key: OPENCHARGE_API_KEY,
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
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];

    const stations = (await response.json()) as OpenChargePoi[];
    return stations.flatMap((station) => {
      const address = station.AddressInfo;
      const stationLat = address?.Latitude;
      const stationLng = address?.Longitude;
      if (
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
      const addressLabel = [
        address.AddressLine1,
        address.Town,
      ]
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
          availability: station.StatusType?.IsOperational
            ? "unknown"
            : "unavailable",
          price_kwh: null,
          distance_km: address.Distance ?? 0,
        },
      ];
    });
  } catch {
    return [];
  }
}