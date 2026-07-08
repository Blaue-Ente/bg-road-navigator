"use client";

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { CommunityPin } from "@/types/community.types";
import { useCommunityStore } from "@/lib/stores/community.store";

export interface CommunityPinsProps {
  map: mapboxgl.Map | null;
  pins?: CommunityPin[];
}

export function CommunityPins({ map, pins = [] }: CommunityPinsProps) {
  const communityStore = useCommunityStore();

  useEffect(() => {
    if (!map) return;

    // Clear existing pins layer if any
    if (map.getLayer("community-pins")) {
      map.removeLayer("community-pins");
      map.removeSource("community-pins");
    }

    // Add new pins
    if (pins.length > 0) {
      map.addSource("community-pins", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: pins.map((pin) => {
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
              other: "#95A5A6"
            };

            return {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [pin.coords.lng, pin.coords.lat]
              },
              properties: {
                title: pin.title,
                category: pin.category,
                color: colorMap[pin.category]
              }
            };
          })
        }
      });

      map.addLayer({
        id: "community-pins",
        type: "circle",
        source: "community-pins",
        minzoom: 10,
        maxzoom: 15,
        paint: {
          "circle-radius": 6,
          "circle-color": "rgba(0, 0, 0, 0.3)",
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "color"]
        }
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