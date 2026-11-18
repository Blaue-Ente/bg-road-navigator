import type { EVStation, FuelStation, FuelTypeCode } from "@/types/fuel.types";

/** The fuels a driver can ask for, in the order the chips show them. */
export const FUEL_FILTER_CODES: FuelTypeCode[] = [
  "diesel",
  "petrol95",
  "petrol98",
  "lpg",
  "cng",
  "hvo",
  "e85",
  "adblue",
];

const PRICE_KEY: Partial<Record<FuelTypeCode, keyof FuelStation["prices"]>> = {
  diesel: "diesel",
  petrol95: "petrol95",
  petrol98: "petrol98",
  lpg: "lpg",
  adblue: "adblue",
};

/** True when the station has the fuel: tagged on the map, or priced. */
export function stationHasFuel(station: FuelStation, code: FuelTypeCode): boolean {
  if (station.fuel_types?.includes(code)) return true;
  const key = PRICE_KEY[code];
  return key != null && station.prices[key] != null;
}

/** Stations that have every chosen fuel; no choice keeps all. */
export function filterStationsByFuel(
  stations: FuelStation[],
  chosen: FuelTypeCode[]
): FuelStation[] {
  if (chosen.length === 0) return stations;
  return stations.filter((station) => chosen.every((code) => stationHasFuel(station, code)));
}

export type ConnectorGroup = "ccs" | "chademo" | "type2" | "other";

export const CONNECTOR_GROUPS: ConnectorGroup[] = ["ccs", "type2", "chademo", "other"];

/** Which plug family an OpenChargeMap connector title belongs to. */
export function connectorGroup(title: string): ConnectorGroup {
  const text = title.toLowerCase();
  if (text.includes("ccs") || text.includes("combo")) return "ccs";
  if (text.includes("chademo")) return "chademo";
  if (text.includes("type 2") || text.includes("mennekes") || text.includes("iec 62196-2")) {
    return "type2";
  }
  return "other";
}

/** Power steps the chips offer, in kW; 0 means any. */
export const POWER_STEPS_KW = [0, 22, 50, 150] as const;

export function filterChargers(
  stations: EVStation[],
  filter: { minKw: number; connectors: ConnectorGroup[] }
): EVStation[] {
  return stations.filter((station) => {
    if (station.power_kw < filter.minKw) return false;
    if (filter.connectors.length === 0) return true;
    const groups = new Set(station.connector_types.map(connectorGroup));
    return filter.connectors.some((group) => groups.has(group));
  });
}
