import type { Map } from "maplibre-gl";

/** True when the MapLibre instance still has a style and can accept layer/source calls. */
export function isMapReady(map: Map | null | undefined): map is Map {
  if (!map) return false;
  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
}
