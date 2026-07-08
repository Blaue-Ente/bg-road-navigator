"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapCanvasProps {
  onMapLoad?: (map: mapboxgl.Map) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

export function MapCanvas({ onMapLoad, className, center = [23.3219, 42.6977], zoom = 7 }: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token missing");
      return;
    }

    mapboxgl.accessToken = token;
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
    });

    mapInstance.current.on("load", () => {
      if (mapInstance.current) {
        onMapLoad?.(mapInstance.current);
      }
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [center, zoom, onMapLoad]);

  return (
    <div className={`relative w-full h-full ${className ?? ""}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
