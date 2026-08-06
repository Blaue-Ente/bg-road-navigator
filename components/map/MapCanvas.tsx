"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyleUrl } from "@/lib/constants/map-style";
import { applyWazeMapTheme } from "@/lib/map/apply-waze-style";

const DEFAULT_CENTER: [number, number] = [23.3219, 42.6977];
const DEFAULT_ZOOM = 7;

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
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  wazeTheme = true,
}: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const onMapLoadRef = useRef(onMapLoad);
  const wazeThemeRef = useRef(wazeTheme);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);

  useEffect(() => {
    onMapLoadRef.current = onMapLoad;
  }, [onMapLoad]);

  useEffect(() => {
    wazeThemeRef.current = wazeTheme;
  }, [wazeTheme]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyleUrl(),
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      attributionControl: false,
    });

    mapInstance.current = map;

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.on("load", () => {
      if (wazeThemeRef.current) {
        applyWazeMapTheme(map);
      }
      onMapLoadRef.current?.(map);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const [lng, lat] = center;
    const current = map.getCenter();
    if (current.lng !== lng || current.lat !== lat) {
      map.setCenter(center);
    }
  }, [center]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom);
    }
  }, [zoom]);

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
