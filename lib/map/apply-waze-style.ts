/**
 * Runtime MapLibre tweaks — Waze-like dark road hierarchy on Carto basemap
 */

import type { Map } from "maplibre-gl";
import { theme } from "@/lib/constants/theme";

const ROAD_LAYER_PAINT: Record<string, Record<string, unknown>> = {
  motorway: { "line-color": "#4a6a8a", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 12, 3, 16, 6] },
  trunk: { "line-color": "#3d5568" },
  primary: { "line-color": "#354a5c" },
  secondary: { "line-color": "#2d3f4f" },
  tertiary: { "line-color": "#263545" },
  minor: { "line-color": "#1f2d3a" },
  service: { "line-color": "#1a2530" },
};

function patchLayer(map: Map, layerId: string, paint: Record<string, unknown>) {
  if (!map.getLayer(layerId)) return;
  for (const [key, value] of Object.entries(paint)) {
    try {
      map.setPaintProperty(layerId, key, value);
    } catch {
      // layer may not support property
    }
  }
}

export function applyWazeMapTheme(map: Map): void {
  // Darken background / water for Waze feel
  const backgroundLayers = ["background", "water", "water_shadow"];
  for (const id of backgroundLayers) {
    if (map.getLayer(id)) {
      try {
        map.setPaintProperty(id, "background-color", theme.bg);
        map.setPaintProperty(id, "fill-color", "#0d1520");
      } catch {
        // not a fill layer
      }
    }
  }

  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id;
    if (layer.type !== "line") continue;

    if (id.includes("motorway")) {
      patchLayer(map, id, ROAD_LAYER_PAINT.motorway!);
    } else if (id.includes("trunk") || id.includes("primary")) {
      patchLayer(map, id, ROAD_LAYER_PAINT.primary!);
    } else if (id.includes("secondary") || id.includes("tertiary")) {
      patchLayer(map, id, ROAD_LAYER_PAINT.secondary!);
    } else if (id.includes("minor") || id.includes("street")) {
      patchLayer(map, id, ROAD_LAYER_PAINT.minor!);
    } else if (id.includes("service") || id.includes("path")) {
      patchLayer(map, id, ROAD_LAYER_PAINT.service!);
    }
  }

  // Subtle land tint
  for (const layer of style.layers) {
    if (layer.id.includes("land") && layer.type === "fill") {
      try {
        map.setPaintProperty(layer.id, "fill-color", "#111820");
      } catch {
        // skip
      }
    }
  }
}

export function fitMapToRoute(
  map: Map,
  coordinates: [number, number][]
): void {
  if (coordinates.length < 2) return;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    { padding: { top: 120, bottom: 200, left: 48, right: 48 }, duration: 1200 }
  );
}
