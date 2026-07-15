"use client";

import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import type { Route } from "@/types/route.types";
import { theme } from "@/lib/constants/theme";

export interface RouteLayerProps {
  map: Map | null;
  route: Route | null;
  alternatives?: Route[];
}

export function RouteLayer({ map, route, alternatives = [] }: RouteLayerProps) {
  useEffect(() => {
    if (!map || !route) return;

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
        "line-color": theme.routeCasing,
        "line-opacity": 0.85,
      },
    });

    map.addLayer({
      id: "route-main",
      type: "line",
      source: "route-main",
      paint: {
        "line-width": 6,
        "line-color": theme.routeLine,
      },
    });

    alternatives.forEach((alt, idx) => {
      const color = theme.routeAlt[idx % theme.routeAlt.length];
      map.addSource(`route-alt-${idx}`, {
        type: "geojson",
        data: alt.geometry,
      });
      map.addLayer({
        id: `route-alt-${idx}`,
        type: "line",
        source: `route-alt-${idx}`,
        paint: {
          "line-width": 4,
          "line-color": color,
          "line-opacity": 0.65,
        },
      });
    });

    return () => {
      ["route-main", "route-main-casing"].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("route-main")) map.removeSource("route-main");
      alternatives.forEach((_, idx) => {
        if (map.getLayer(`route-alt-${idx}`)) map.removeLayer(`route-alt-${idx}`);
        if (map.getSource(`route-alt-${idx}`)) map.removeSource(`route-alt-${idx}`);
      });
    };
  }, [map, route, alternatives]);

  return null;
}
