"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import { useMapStore } from "@/lib/stores/map.store";

export function UserLocationMarker({ map }: { map: Map | null }) {
  const location = useMapStore((s) => s.userLocation);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map || !location) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "h-4 w-4 rounded-full border-2 border-white shadow-md";
      el.style.background = "#33ccff";
      el.setAttribute("aria-hidden", "true");
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([location.lng, location.lat]);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, [map, location]);

  return null;
}
