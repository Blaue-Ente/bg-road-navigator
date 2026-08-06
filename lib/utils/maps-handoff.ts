import type { GeoPoint } from "@/types/route.types";

/** Build Google Maps directions URL (web + Android intent-friendly). */
export function googleMapsDirectionsUrl(
  origin: GeoPoint & { label?: string },
  destination: GeoPoint & { label?: string }
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Build Apple Maps directions URL. */
export function appleMapsDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint
): string {
  const params = new URLSearchParams({
    saddr: `${origin.lat},${origin.lng}`,
    daddr: `${destination.lat},${destination.lng}`,
    dirflg: "d",
  });
  return `https://maps.apple.com/?${params.toString()}`;
}
