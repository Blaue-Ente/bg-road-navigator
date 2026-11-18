"use client";

import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import { communityPinColor } from "@/lib/constants/community-pins";
import { useMapStore } from "@/lib/stores/map.store";
import type { CommunityPin } from "@/types/community.types";

const SOURCE = "community-segments";
const LAYER = "community-segments-line";

/** Bad stretches reported by drivers, drawn as a line between their two ends. */
export function CommunitySegments({ map, pins = [] }: { map: Map | null; pins?: CommunityPin[] }) {
  const enabled = useMapStore((s) => s.layers.community);

  useEffect(() => {
    if (!map) return;
    const features = enabled
      ? pins
          .filter((pin) => pin.end_coords)
          .map((pin) => ({
            type: "Feature" as const,
            properties: { color: communityPinColor(pin.category) },
            geometry: {
              type: "LineString" as const,
              coordinates: [
                [pin.coords.lng, pin.coords.lat],
                [pin.end_coords!.lng, pin.end_coords!.lat],
              ],
            },
          }))
      : [];
    const data = { type: "FeatureCollection" as const, features };
    const apply = () => {
      try {
        const source = map.getSource(SOURCE) as { setData?: (data: unknown) => void } | undefined;
        if (source?.setData) {
          source.setData(data);
          return;
        }
        map.addSource(SOURCE, { type: "geojson", data });
        map.addLayer({
          id: LAYER,
          type: "line",
          source: SOURCE,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 5,
            "line-opacity": 0.85,
            "line-dasharray": [2, 1.5],
          },
        });
      } catch {
        // The style may still be loading; the next change tries again.
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [map, pins, enabled]);

  return null;
}
