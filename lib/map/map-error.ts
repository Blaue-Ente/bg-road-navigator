export interface MapErrorEventLike {
  sourceId?: string;
  tile?: unknown;
  error?: { message?: string };
}

/**
 * MapLibre emits `error` for a single missed tile. That should not cover the map.
 * Style JSON and other load failures have no tile and no source.
 */
export function isFatalMapError(event: MapErrorEventLike): boolean {
  if (event.tile != null || event.sourceId) return false;

  const message = event.error?.message?.toLowerCase() ?? "";
  if (message.includes("tile")) return false;

  return true;
}
