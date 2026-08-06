"use client";

import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import type { CommunityPin } from "@/types/community.types";
import { communityPinColor } from "@/lib/constants/community-pins";
import { isMapReady } from "@/lib/map/is-map-ready";

export interface CommunityPinsProps {
  map: Map | null;
  pins?: CommunityPin[];
}

function removeCommunityPinsLayer(map: Map) {
  if (!isMapReady(map)) return;
  if (map.getLayer("community-pins")) {
    map.removeLayer("community-pins");
  }
  if (map.getSource("community-pins")) {
    map.removeSource("community-pins");
  }
}

export function CommunityPins({ map, pins = [] }: CommunityPinsProps) {
  useEffect(() => {
    if (!isMapReady(map)) return;

    removeCommunityPinsLayer(map);

    if (pins.length > 0) {
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
              color: communityPinColor(pin.category),
            },
          })),
        },
      });

      map.addLayer({
        id: "community-pins",
        type: "circle",
        source: "community-pins",
        minzoom: 5,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            4,
            12,
            8,
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0b0f14",
        },
      });
    }

    return () => {
      removeCommunityPinsLayer(map);
    };
  }, [map, pins]);

  return null;
}
