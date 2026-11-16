const FUELO_ROOT = "https://api.fuelo.net";

export type FueloFuel = "diesel" | "petrol" | "petrol95" | "lpg";

export interface FueloAverage {
  country: string;
  fuel: string;
  date: string;
  price: number;
  currency: string;
  unit: string;
}

export interface FueloFetchResult {
  ok: boolean;
  status: number;
  data: FueloAverage | null;
}

export function fueloAuthHeaders(apiKey: string): HeadersInit {
  const trimmed = apiKey.trim();
  return {
    Authorization: `Bearer ${trimmed}`,
    "X-API-Key": trimmed,
    Accept: "application/json",
  };
}

export async function fetchFueloAverage(
  country: string,
  fuel: FueloFuel,
  deps: { fetchImpl?: typeof fetch; apiKey: string } = { apiKey: "" }
): Promise<FueloFetchResult> {
  const apiKey = deps.apiKey.trim();
  if (!apiKey) return { ok: false, status: 0, data: null };
  const fuelParam = fuel === "petrol95" ? "petrol" : fuel;
  const url = `${FUELO_ROOT}/v2/prices/average?country=${encodeURIComponent(country.toLowerCase())}&fuel=${encodeURIComponent(fuelParam)}`;
  try {
    const response = await (deps.fetchImpl ?? fetch)(url, {
      headers: fueloAuthHeaders(apiKey),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      return { ok: false, status: response.status, data: null };
    }
    const payload = (await response.json()) as { data?: unknown };
    const parsed = parseFueloAverage(payload.data);
    return { ok: Boolean(parsed), status: response.status, data: parsed };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export function parseFueloAverage(raw: unknown): FueloAverage | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const price = row.price;
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  return {
    country: String(row.country ?? "").toUpperCase(),
    fuel: String(row.fuel ?? ""),
    date: String(row.date ?? ""),
    price,
    currency: String(row.currency ?? "EUR"),
    unit: String(row.unit ?? "L"),
  };
}