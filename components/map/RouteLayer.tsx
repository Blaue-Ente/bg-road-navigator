"use client";

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { Route } from "@/types/route.types";

export interface RouteLayerProps {
  map: mapboxgl.Map | null;
  route: Route | null;
  alternatives?: Route[];
}

export function RouteLayer({ map, route, alternatives = [] }: RouteLayerProps) {
  useEffect(() => {
    if (!map || !route) return;

    // Add route source
    map.addSource("route-main", {
      type: "geojson",
      data: route.geometry,
    });

    // Add route layer
    map.addLayer({
      id: "route-main",
      type: "line",
      source: "route-main",
      "line-width": 5,
      "line-color": "#1B4F72",
    });

    // Add alternatives
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
        "line-width": 4,
        "line-color": colors[idx % colors.length],
        "line-opacity": 0.7,
      });
    });

    return () => {
      map.removeLayer("route-main");
      map.removeSource("route-main");
      alternatives.forEach((_, idx) => {
        map.removeLayer(`route-alt-${idx}`);
        map.removeSource(`route-alt-${idx}`);
      });
    };
  }, [map, route, alternatives]);

  return null;
}