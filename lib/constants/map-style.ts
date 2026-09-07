/**
 * MapLibre GL style URLs — open-source, no API key required.
 * @see https://github.com/maplibre
 */

export const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const LIGHT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

/** Waze-tuned variant — same tiles, themed at runtime via applyWazeMapTheme */
export const WAZE_DARK_STYLE = DEFAULT_MAP_STYLE;

export const MAP_STYLE_OPTIONS = {
  dark: DEFAULT_MAP_STYLE,
  voyager: LIGHT_MAP_STYLE,
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  demo: "https://demotiles.maplibre.org/style.json",
} as const;

export function getMapStyleUrl(scheme: "dark" | "light" = "dark"): string {
  const configured = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (configured) return configured;
  return scheme === "light" ? LIGHT_MAP_STYLE : WAZE_DARK_STYLE;
}
