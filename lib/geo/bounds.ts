/** Rough Europe bounding box used across routing, POI, and community APIs. */
export const EUROPE_BOUNDS = {
  minLng: -25,
  maxLng: 45,
  minLat: 34,
  maxLat: 72,
} as const;

export function isInEurope(lng: number, lat: number): boolean {
  return (
    lng >= EUROPE_BOUNDS.minLng &&
    lng <= EUROPE_BOUNDS.maxLng &&
    lat >= EUROPE_BOUNDS.minLat &&
    lat <= EUROPE_BOUNDS.maxLat
  );
}

export function isValidBbox(bbox: {
  w: number;
  s: number;
  e: number;
  n: number;
}): boolean {
  if (![bbox.w, bbox.s, bbox.e, bbox.n].every(Number.isFinite)) return false;
  if (bbox.w >= bbox.e || bbox.s >= bbox.n) return false;
  if (!isInEurope(bbox.w, bbox.s) || !isInEurope(bbox.e, bbox.n)) return false;
  const width = bbox.e - bbox.w;
  const height = bbox.n - bbox.s;
  return width <= 25 && height <= 20;
}
