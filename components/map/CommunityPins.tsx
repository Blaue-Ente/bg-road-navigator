"use client";

import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import type { CommunityPin } from "@/types/community.types";

export interface CommunityPinsProps {
  map: Map | null;
  pins?: CommunityPin[];
}

export function CommunityPins({ map, pins = [] }: CommunityPinsProps) {
  useEffect(() => {
    if (!map) return;

    if (map.getLayer("community-pins")) {
      map.removeLayer("community-pins");
      map.removeSource("community-pins");
    }

    if (pins.length > 0) {
      const colorMap = {
        police: "#E74C3C",
        accident: "#E74C3C",
        hazard: "#F39C12",
        road_works: "#F39C12",
        traffic_jam: "#F39C12",
        fuel_issue: "#E67E22",
        border_info: "#3498DB",
        rest_area: "#27AE60",
        point_of_interest: "#9B59B6",
        other: "#95A5A6",
      };

      map.addSource("community-pins", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: pins.map((pin) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [pin.coords.lng, pin.coords.lat],
            },
            properties: {
              title: pin.title,
              category: pin.category,
              color: colorMap[pin.category],
            },
          })),
        },
      });

      map.addLayer({
        id: "community-pins",
        type: "circle",
        source: "community-pins",
        minzoom: 6,
        paint: {
          "circle-radius": 6,
          "circle-color": "rgba(0, 0, 0, 0.3)",
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "color"],
        },
      });
    }

    return () => {
      if (map.getLayer("community-pins")) {
        map.removeLayer("community-pins");
        map.removeSource("community-pins");
      }
    };
  }, [map, pins]);

  return null;
}
