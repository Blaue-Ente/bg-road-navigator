import { haversineKm } from "@/lib/geo/haversine";
import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";

export interface BorderOnRoute {
  id: string;
  name_bg: string;
  name_en: string;
  distance_km: number;
}

const BG_CROSSINGS = BORDER_CROSSINGS.filter((crossing) =>
  crossing.country_pair.startsWith("BG")
);

/** Closest Bulgarian crossing to a route, when the line passes near one. */
export function nearestBgBorder(
  coordinates: Array<[number, number]>,
  maxKm = 25
): BorderOnRoute | null {
  if (coordinates.length === 0) return null;
  const step = Math.max(1, Math.floor(coordinates.length / 400));
  let best: BorderOnRoute | null = null;

  for (let i = 0; i < coordinates.length; i += step) {
    const [lng, lat] = coordinates[i]!;
    for (const crossing of BG_CROSSINGS) {
      const distance_km = haversineKm(
        { lng, lat },
        crossing.coords
      );
      if (distance_km > maxKm) continue;
      if (!best || distance_km < best.distance_km) {
        best = {
          id: crossing.id,
          name_bg: crossing.name_bg,
          name_en: crossing.name_en,
          distance_km: Math.round(distance_km * 10) / 10,
        };
      }
    }
  }

  const last = coordinates[coordinates.length - 1];
  if (last) {
    for (const crossing of BG_CROSSINGS) {
      const distance_km = haversineKm(
        { lng: last[0], lat: last[1] },
        crossing.coords
      );
      if (distance_km > maxKm) continue;
      if (!best || distance_km < best.distance_km) {
        best = {
          id: crossing.id,
          name_bg: crossing.name_bg,
          name_en: crossing.name_en,
          distance_km: Math.round(distance_km * 10) / 10,
        };
      }
    }
  }

  return best;
}

export function nearestBgBorderPoint(
  point: { lng: number; lat: number },
  maxKm = 20
): BorderOnRoute | null {
  return nearestBgBorder([[point.lng, point.lat]], maxKm);
}
