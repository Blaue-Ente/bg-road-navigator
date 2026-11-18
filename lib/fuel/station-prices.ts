import { cachedValue, snapToGrid } from "@/lib/cache/shared-cache";
import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import { haversineKm } from "@/lib/geo/haversine";
import { fetchEcontrolPrices } from "@/lib/fuel-prices/e-control";
import { fetchTankerkoenigPrices } from "@/lib/fuel-prices/tankerkoenig";
import type { KnownPrice, PriceFuel } from "@/lib/fuel-prices/types";
import type { FuelStation } from "@/types/fuel.types";

/** A price counts for a station when it was read within this distance. */
const MATCH_KM = 0.2;
const MAX_CENTERS = 4;
const E_CONTROL_TTL_MS = 10 * 60_000;

export interface OfficialPrices {
  diesel: KnownPrice[];
  petrol: KnownPrice[];
}

function nearest(prices: KnownPrice[], station: FuelStation): KnownPrice | null {
  let best: { price: KnownPrice; km: number } | null = null;
  for (const price of prices) {
    const km = haversineKm(station.coords, { lng: price.lng, lat: price.lat });
    if (km <= MATCH_KM && (!best || km < best.km)) best = { price, km };
  }
  return best?.price ?? null;
}

/**
 * Fills in the diesel and petrol prices of stations that have none, from the
 * official price lists next to them. Stations with a price are left as they are.
 */
export function applyOfficialPrices(
  stations: FuelStation[],
  official: OfficialPrices
): FuelStation[] {
  return stations.map((station) => {
    if (station.prices.diesel != null && station.prices.petrol95 != null) {
      return station;
    }
    const diesel = station.prices.diesel == null ? nearest(official.diesel, station) : null;
    const petrol = station.prices.petrol95 == null ? nearest(official.petrol, station) : null;
    if (!diesel && !petrol) return station;
    const source = (diesel ?? petrol)!;
    return {
      ...station,
      prices: {
        ...station.prices,
        ...(diesel ? { diesel: diesel.amount } : {}),
        ...(petrol ? { petrol95: petrol.amount } : {}),
      },
      price_source: source.source,
      price_observed_at: source.observedAt,
    };
  });
}

async function listFor(
  center: { lng: number; lat: number },
  fuel: PriceFuel,
  now: Date
): Promise<KnownPrice[]> {
  const country = countryCodeAtPoint(center.lng, center.lat);
  try {
    if (country === "DE") {
      const apiKey = process.env.TANKERKOENIG_API_KEY?.trim();
      if (!apiKey) return [];
      return await fetchTankerkoenigPrices(
        { fuel, ...center2(center) },
        { fetchImpl: fetch, now, apiKey }
      );
    }
    if (country === "AT") {
      const { value } = await cachedValue<KnownPrice[]>({
        key: `econtrol-list|${fuel}|${snapToGrid(center.lat, 0.05).toFixed(2)}|${snapToGrid(center.lng, 0.05).toFixed(2)}`,
        kind: "econtrol_list",
        ttlMs: E_CONTROL_TTL_MS,
        persist: false,
        load: async () => {
          const prices = await fetchEcontrolPrices(
            { fuel, ...center2(center) },
            { fetchImpl: fetch, now }
          );
          return prices.length > 0 ? prices : null;
        },
      });
      return value ?? [];
    }
  } catch {
    return [];
  }
  return [];
}

function center2(center: { lng: number; lat: number }) {
  return { lat: center.lat, lng: center.lng };
}

/**
 * Official station prices in Germany (Tankerkönig) and Austria (E-Control),
 * read around a few points of the search area. Anywhere else, or without the
 * Tankerkönig key, the stations keep showing no price rather than a guess.
 */
export async function withOfficialPrices(
  stations: FuelStation[],
  centers: Array<{ lng: number; lat: number }>,
  now: Date = new Date()
): Promise<FuelStation[]> {
  if (stations.length === 0) return stations;
  const unique = new Map<string, { lng: number; lat: number }>();
  for (const center of centers) {
    const country = countryCodeAtPoint(center.lng, center.lat);
    if (country !== "DE" && country !== "AT") continue;
    unique.set(
      `${snapToGrid(center.lat, 0.1).toFixed(1)}|${snapToGrid(center.lng, 0.1).toFixed(1)}`,
      center
    );
  }
  const points = [...unique.values()].slice(0, MAX_CENTERS);
  if (points.length === 0) return stations;
  const lists = await Promise.all(
    points.map(async (point) => ({
      diesel: await listFor(point, "diesel", now),
      petrol: await listFor(point, "petrol", now),
    }))
  );
  return applyOfficialPrices(stations, {
    diesel: lists.flatMap((list) => list.diesel),
    petrol: lists.flatMap((list) => list.petrol),
  });
}
