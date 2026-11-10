/**
 * MapLibre GL style URLs — open-source, no API key required.
 * Day style is the default so roads stay readable.
 * `NEXT_PUBLIC_MAP_STYLE_URL` still replaces both schemes when set.
 * @see https://openfreemap.org
 */

export const LIGHT_MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export const DARK_MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

/** @deprecated Dark basemap kept for callers that still name the old token. */
export const DEFAULT_MAP_STYLE = DARK_MAP_STYLE;

export const WAZE_DARK_STYLE = DARK_MAP_STYLE;

export const MAP_STYLE_OPTIONS = {
  dark: DARK_MAP_STYLE,
  positron: LIGHT_MAP_STYLE,
  cartoPositron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  cartoDark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  demo: "https://demotiles.maplibre.org/style.json",
} as const;

export function getMapStyleUrl(scheme: "dark" | "light" = "light"): string {
  const configured = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (configured) return configured;
  return scheme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}
