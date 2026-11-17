import type { ConsumptionCandidate, VehicleFuel } from "@/lib/vehicles/types";

const BASE = "https://www.fueleconomy.gov/ws/rest/vehicle";
const TIMEOUT_MS = 6_000;
const MPG_TO_L100 = 235.215;
const MILE_KM = 1.609344;

/** Spoken names that differ from the EPA make list. */
const MAKE_ALIASES: Record<string, string> = {
  vw: "Volkswagen",
  merc: "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  benz: "Mercedes-Benz",
  chevy: "Chevrolet",
  alfa: "Alfa Romeo",
  landrover: "Land Rover",
  "range rover": "Land Rover",
};

export function mpgToLPer100(mpg: number): number {
  return Math.round((MPG_TO_L100 / mpg) * 10) / 10;
}

/** The EPA lists electric consumption in kWh per 100 miles. */
export function kwhPer100MilesToKm(value: number): number {
  return Math.round((value / MILE_KM) * 10) / 10;
}

export function parseVehicleQuery(query: string): {
  tokens: string[];
  year: number | null;
} {
  const yearMatch = query.match(/\b(19[89]\d|20[0-4]\d)\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const tokens = query
    .toLowerCase()
    .replace(/\b(19[89]\d|20[0-4]\d)\b/g, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  return { tokens, year };
}

export function matchMake(tokens: string[], makes: string[]): string | null {
  const joined = tokens.join(" ");
  for (const [alias, make] of Object.entries(MAKE_ALIASES)) {
    if (
      (tokens.includes(alias) || joined.includes(alias)) &&
      makes.includes(make)
    ) {
      return make;
    }
  }
  let best: string | null = null;
  for (const make of makes) {
    const lower = make.toLowerCase();
    if (tokens.includes(lower) || joined.includes(lower)) {
      if (!best || make.length > best.length) best = make;
    }
  }
  return best;
}

export function matchModels(
  tokens: string[],
  make: string,
  models: string[]
): string[] {
  const makeTokens = new Set(make.toLowerCase().split(/\s+/));
  const rest = tokens.filter((token) => !makeTokens.has(token));
  if (rest.length === 0) return [];
  const scored = models
    .map((model) => {
      const lower = model.toLowerCase();
      const parts = lower.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
      const hits = rest.filter((token) => parts.includes(token)).length;
      const full = rest.join(" ") === lower ? 2 : 0;
      return { model, score: hits + full - (parts.length - hits) * 0.1 };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((row) => row.model);
}

async function getJson<T>(path: string, fetchImpl: typeof fetch): Promise<T | null> {
  try {
    const response = await fetchImpl(`${BASE}/${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 86_400 },
    } as RequestInit);
    if (!response.ok) return null;
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

interface MenuResponse {
  menuItem?: Array<{ text: string; value: string }> | { text: string; value: string };
}

function menuItems(payload: MenuResponse | null) {
  const item = payload?.menuItem;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

interface VehicleRecord {
  year?: string;
  make?: string;
  model?: string;
  highway08?: string;
  comb08?: string;
  fuelType1?: string;
  highwayE?: string;
  combE?: string;
  range?: string;
  rangeHwy?: string;
}

function fuelFromRecord(record: VehicleRecord): VehicleFuel {
  const fuel = (record.fuelType1 ?? "").toLowerCase();
  if (fuel.includes("electric")) return "electric";
  if (fuel.includes("diesel")) return "diesel";
  return "petrol";
}

export function candidateFromRecord(
  record: VehicleRecord
): ConsumptionCandidate | null {
  const fuel = fuelFromRecord(record);
  const year = Number(record.year);
  const label = [record.year, record.make, record.model]
    .filter(Boolean)
    .join(" ");
  if (!Number.isFinite(year)) return null;
  if (fuel === "electric") {
    const highwayE = Number(record.highwayE);
    const combE = Number(record.combE);
    const per100 = highwayE > 0 ? highwayE : combE;
    if (!(per100 > 0)) return null;
    const range = Number(record.range);
    return {
      label,
      year,
      highway_per_100: kwhPer100MilesToKm(per100),
      combined_per_100: combE > 0 ? kwhPer100MilesToKm(combE) : null,
      fuel_type: "electric",
      vehicle_type: "ev",
      ev_range_km: range > 0 ? Math.round(range * MILE_KM) : null,
      source: "fueleconomy.gov",
    };
  }
  const highway = Number(record.highway08);
  const combined = Number(record.comb08);
  if (!(highway > 0)) return null;
  return {
    label,
    year,
    highway_per_100: mpgToLPer100(highway),
    combined_per_100: combined > 0 ? mpgToLPer100(combined) : null,
    fuel_type: fuel,
    vehicle_type: "car",
    ev_range_km: null,
    source: "fueleconomy.gov",
  };
}

/**
 * Known extra-urban consumption for a free-text car name such as
 * "VW Passat 2018 2.0 TDI". Uses the US EPA database, so some European-only
 * models are not found; the caller then asks the driver to type the figure.
 */
export async function lookupConsumption(
  query: string,
  fetchImpl: typeof fetch = fetch
): Promise<ConsumptionCandidate[]> {
  const { tokens, year } = parseVehicleQuery(query);
  if (tokens.length === 0) return [];
  const years = year
    ? [year]
    : [2023, 2021, 2019, 2017, 2015, 2013];
  const found: ConsumptionCandidate[] = [];
  for (const candidateYear of years) {
    const makesPayload = await getJson<MenuResponse>(
      `menu/make?year=${candidateYear}`,
      fetchImpl
    );
    const makes = menuItems(makesPayload).map((item) => item.value);
    const make = matchMake(tokens, makes);
    if (!make) continue;
    const modelsPayload = await getJson<MenuResponse>(
      `menu/model?year=${candidateYear}&make=${encodeURIComponent(make)}`,
      fetchImpl
    );
    const models = matchModels(
      tokens,
      make,
      menuItems(modelsPayload).map((item) => item.value)
    );
    for (const model of models) {
      const optionsPayload = await getJson<MenuResponse>(
        `menu/options?year=${candidateYear}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
        fetchImpl
      );
      for (const option of menuItems(optionsPayload).slice(0, 4)) {
        const record = await getJson<VehicleRecord>(option.value, fetchImpl);
        const candidate = record ? candidateFromRecord(record) : null;
        if (candidate) {
          found.push({
            ...candidate,
            label: `${candidate.label} · ${option.text}`,
          });
        }
      }
    }
    if (found.length > 0) break;
  }
  return found.slice(0, 6);
}
