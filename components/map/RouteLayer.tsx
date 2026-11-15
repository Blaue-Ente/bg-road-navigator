"use client";

import { useEffect } from "react";
import type { Map, MapLayerMouseEvent } from "maplibre-gl";
import type { Route } from "@/types/route.types";
import { theme } from "@/lib/constants/theme";
import { isMapReady } from "@/lib/map/is-map-ready";
import { useThemeStore } from "@/lib/stores/theme.store";

export interface RouteLayerProps {
  map: Map | null;
  route: Route | null;
  alternatives?: Route[];
  onPickAlternative?: (index: number) => void;
}

function removeRouteLayers(map: Map, alternativeCount: number) {
  if (!isMapReady(map)) return;

  ["route-main", "route-main-casing"].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource("route-main")) map.removeSource("route-main");

  for (let idx = 0; idx < alternativeCount; idx++) {
    if (map.getLayer(`route-alt-${idx}`)) map.removeLayer(`route-alt-${idx}`);
    if (map.getSource(`route-alt-${idx}`)) map.removeSource(`route-alt-${idx}`);
  }
}

export function RouteLayer({
  map,
  route,
  alternatives = [],
  onPickAlternative,
}: RouteLayerProps) {
  const scheme = useThemeStore((s) => s.scheme);
  const line = scheme === "dark" ? theme.routeLineDark : theme.routeLine;
  const casing = scheme === "dark" ? theme.routeCasingDark : theme.routeCasing;

  useEffect(() => {
    if (!isMapReady(map) || !route) return;

    map.addSource("route-main", {
      type: "geojson",
      data: route.geometry,
    });

    // Waze-style route casing (darker outline)
    map.addLayer({
      id: "route-main-casing",
      type: "line",
      source: "route-main",
      paint: {
        "line-width": 9,
        "line-color": casing,
        "line-opacity": 0.85,
      },
    });

    map.addLayer({
      id: "route-main",
      type: "line",
      source: "route-main",
      paint: {
        "line-width": 6,
        "line-color": line,
      },
    });

    const handlers: Array<{
      layerId: string;
      handler: (event: MapLayerMouseEvent) => void;
    }> = [];

    alternatives.forEach((alt, idx) => {
      const color = theme.routeAlt[idx % theme.routeAlt.length];
      const layerId = `route-alt-${idx}`;
      map.addSource(layerId, {
        type: "geojson",
        data: alt.geometry,
      });
      map.addLayer({
        id: layerId,
        type: "line",
        source: layerId,
        paint: {
          "line-width": 4,
          "line-color": color,
          "line-opacity": 0.65,
        },
      });
      if (onPickAlternative) {
        map.getCanvas().style.cursor = "";
        const handler = () => onPickAlternative(idx);
        map.on("click", layerId, handler);
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
        handlers.push({ layerId, handler });
      }
    });

    return () => {
      for (const { layerId, handler } of handlers) {
        map.off("click", layerId, handler);
      }
      removeRouteLayers(map, alternatives.length);
    };
  }, [map, route, alternatives, line, casing, onPickAlternative]);

  return null;
}
