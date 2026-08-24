import { describe, expect, it } from "vitest";
import { mapOpenChargeStations } from "@/lib/api-clients/opencharge";

describe("mapOpenChargeStations", () => {
  it("maps a full v3 POI with operator, connectors, and status", () => {
    const stations = mapOpenChargeStations([
      {
        ID: 1001,
        AddressInfo: {
          Title: "FULLCHARGER / SOFIA 005",
          AddressLine1: "бул. Александър Стамболийски 21",
          Town: "Sofia",
          Latitude: 42.6969,
          Longitude: 23.3195,
          Distance: 0.34,
        },
        OperatorInfo: { Title: "ChargePoint" },
        StatusType: { IsOperational: true },
        Connections: [
          {
            PowerKW: 3.7,
            ConnectionTypeID: 13,
            ConnectionType: { Title: "Europlug 2-Pin (CEE 7/16)" },
          },
        ],
      },
    ]);

    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({
      id: "ocm-1001",
      name: "FULLCHARGER / SOFIA 005",
      operator: "ChargePoint",
      coords: { lng: 23.3195, lat: 42.6969 },
      address: "бул. Александър Стамболийски 21, Sofia",
      power_kw: 3.7,
      connector_types: ["Europlug 2-Pin (CEE 7/16)"],
      availability: "unknown",
      distance_km: 0.34,
    });
  });

  it("falls back to connection IDs when compact payloads omit titles", () => {
    const stations = mapOpenChargeStations([
      {
        ID: 2002,
        AddressInfo: {
          Title: "CCS hub",
          Latitude: 42.7,
          Longitude: 23.32,
        },
        Connections: [{ PowerKW: 150, ConnectionTypeID: 33 }],
      },
    ]);

    expect(stations[0]?.operator).toBe("Неизвестен оператор");
    expect(stations[0]?.connector_types).toEqual(["CCS (Type 2)"]);
    expect(stations[0]?.availability).toBe("unknown");
  });

  it("marks non-operational sites unavailable", () => {
    const stations = mapOpenChargeStations([
      {
        ID: 3,
        AddressInfo: { Title: "Down", Latitude: 42.7, Longitude: 23.32 },
        StatusType: { IsOperational: false },
      },
    ]);
    expect(stations[0]?.availability).toBe("unavailable");
  });

  it("ignores a non-array payload", () => {
    expect(mapOpenChargeStations({ error: "denied" })).toEqual([]);
  });
});
