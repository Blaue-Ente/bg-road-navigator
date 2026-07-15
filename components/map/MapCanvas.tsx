"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyleUrl } from "@/lib/constants/map-style";
import { applyWazeMapTheme } from "@/lib/map/apply-waze-style";

export interface MapCanvasProps {
  onMapLoad?: (map: maplibregl.Map) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
  wazeTheme?: boolean;
}

export function MapCanvas({
  onMapLoad,
  className,
  center = [23.3219, 42.6977],
  zoom = 7,
  wazeTheme = true,
}: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapInstance.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyleUrl(),
      center,
      zoom,
      attributionControl: false,
    });

    mapInstance.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    mapInstance.current.on("load", () => {
      if (!mapInstance.current) return;
      if (wazeTheme) {
        applyWazeMapTheme(mapInstance.current);
      }
      onMapLoad?.(mapInstance.current);
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [center, zoom, onMapLoad, wazeTheme]);

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
