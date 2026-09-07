import type { NearbyPlace } from "@/types/emergency.types";
import { isInEurope } from "@/lib/geo/bounds";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const TIMEOUT_MS = 12_000;

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

function elementPoint(
  el: OverpassElement
): { lng: number; lat: number } | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!isInEurope(lon, lat)) return null;
  return { lng: lon, lat };
}

export async function fetchNearbyEmergencyPlaces(
  lng: number,
  lat: number,
  radiusM = 15_000
): Promise<NearbyPlace[]> {
  if (!isInEurope(lng, lat)) return [];

  const query = `
[out:json][timeout:10];
(
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["shop"="car_repair"](around:${radiusM},${lat},${lng});
  node["amenity"="car_repair"](around:${radiusM},${lat},${lng});
);
out center 16;
`.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json",
        "User-Agent": "BG-Road-Navigator/1.0 (travel planning)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as OverpassResponse;
    const places: NearbyPlace[] = [];
    for (const el of payload.elements ?? []) {
      const coords = elementPoint(el);
      if (!coords) continue;
      const amenity = el.tags?.amenity ?? el.tags?.shop ?? "";
      const kind: NearbyPlace["kind"] =
        amenity === "hospital" || amenity === "clinic" ? "hospital" : "garage";
      const name =
        el.tags?.name ??
        el.tags?.["name:bg"] ??
        (kind === "hospital" ? "Болница / клиника" : "Автосервиз");
      places.push({
        id: `osm-${el.type}-${el.id}`,
        kind,
        name,
        address: el.tags?.["addr:street"]
          ? `${el.tags["addr:street"]} ${el.tags["addr:housenumber"] ?? ""}`.trim()
          : undefined,
        phone: el.tags?.phone ?? el.tags?.["contact:phone"],
        coords,
        maps_url: `https://maps.google.com/?q=${coords.lat},${coords.lng}`,
        source: "openstreetmap",
      });
    }
    return places.slice(0, 12);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
