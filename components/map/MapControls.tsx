"use client";

import { useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

export interface MapControlsProps {
  map: mapboxgl.Map | null;
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
        zoom: 12
      });
    }
  }, [map, getCurrentLocation]);

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <button
        onClick={zoomIn}
        className="w-12 h-12 bg-gray-900 bg-opacity-80 text-white rounded-lg flex items-center justify-center hover:bg-opacity-100 transition"
        aria-label="Приближи"
      >
        +
      </button>
      <button
        onClick={zoomOut}
        className="w-12 h-12 bg-gray-900 bg-opacity-80 text-white rounded-lg flex items-center justify-center hover:bg-opacity-100 transition"
        aria-label="Отдалечи"
      >
        −
      </button>
      <button
        onClick={locate}
        className="w-12 h-12 bg-blue-600 bg-opacity-80 text-white rounded-lg flex items-center justify-center hover:bg-opacity-100 transition"
        aria-label="Намери ме"
      >
        📍
      </button>
    </div>
  );
}