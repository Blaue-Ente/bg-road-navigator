"use client";

import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import type { Route } from "@/types/route.types";

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

    map.addLayer({
      id: "route-main",
      type: "line",
      source: "route-main",
      paint: {
        "line-width": 5,
        "line-color": "#3b82f6",
      },
    });

    alternatives.forEach((alt, idx) => {
      const colors = ["#27AE60", "#F39C12", "#9B59B6"];
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
          "line-color": colors[idx % colors.length],
          "line-opacity": 0.7,
        },
      });
    });

    return () => {
      if (map.getLayer("route-main")) map.removeLayer("route-main");
      if (map.getSource("route-main")) map.removeSource("route-main");
      alternatives.forEach((_, idx) => {
        if (map.getLayer(`route-alt-${idx}`)) map.removeLayer(`route-alt-${idx}`);
        if (map.getSource(`route-alt-${idx}`)) map.removeSource(`route-alt-${idx}`);
      });
    };
  }, [map, route, alternatives]);

  return null;
}
