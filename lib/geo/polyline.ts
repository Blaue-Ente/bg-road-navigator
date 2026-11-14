/**
 * Google-style polyline decoder.
 * Valhalla's default route shape is this encoding at precision 6
 * (1e-6 degrees). Coordinates are returned as GeoJSON [lng, lat].
 */
export function decodePolyline(
  encoded: string,
  precision = 6
): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];
  if (!encoded) return coordinates;

  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = 10 ** precision;

  while (index < encoded.length) {
    const deltaLat = decodeSigned(encoded);
    if (deltaLat == null) break;
    lat += deltaLat.value;
    index = deltaLat.index;

    const deltaLng = decodeSigned(encoded, index);
    if (deltaLng == null) break;
    lng += deltaLng.value;
    index = deltaLng.index;

    coordinates.push([lng / factor, lat / factor]);
  }

  return coordinates;

  function decodeSigned(
    value: string,
    start = index
  ): { value: number; index: number } | null {
    let result = 0;
    let shift = 0;
    let cursor = start;
    let byte = 0;
    do {
      if (cursor >= value.length) return null;
      byte = value.charCodeAt(cursor++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const signed = result & 1 ? ~(result >> 1) : result >> 1;
    return { value: signed, index: cursor };
  }
}
