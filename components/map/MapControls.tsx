"use client";

import { useCallback } from "react";
import type { Map } from "maplibre-gl";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

export interface MapControlsProps {
  map: Map | null;
}

export function MapControls({ map }: MapControlsProps) {
  const { getCurrentLocation } = useGeolocation();

  const zoomIn = useCallback(() => {
    if (map) map.zoomIn();
  }, [map]);

  const zoomOut = useCallback(() => {
    if (map) map.zoomOut();
  }, [map]);

  const locate = useCallback(async () => {
    if (!map) return;
    const position = await getCurrentLocation();
    if (position) {
      map.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 12,
      });
    }
  }, [map, getCurrentLocation]);

  return (
    <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
      <button
        onClick={zoomIn}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900/80 text-white transition hover:bg-gray-900"
        aria-label="Приближи"
      >
        +
      </button>
      <button
        onClick={zoomOut}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900/80 text-white transition hover:bg-gray-900"
        aria-label="Отдалечи"
      >
        −
      </button>
      <button
        onClick={locate}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/80 text-white transition hover:bg-blue-600"
        aria-label="Намери ме"
      >
        📍
      </button>
    </div>
  );
}
