"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyleUrl } from "@/lib/constants/map-style";
import { applyWazeMapTheme } from "@/lib/map/apply-waze-style";
import { useThemeStore } from "@/lib/stores/theme.store";
import { useMapStore } from "@/lib/stores/map.store";

const DEFAULT_CENTER: [number, number] = [23.3219, 42.6977];
const DEFAULT_ZOOM = 7;

export interface MapCanvasProps {
  onMapLoad?: (map: maplibregl.Map) => void;
  onMapClick?: (coords: { lng: number; lat: number }) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
  wazeTheme?: boolean;
  dropMode?: boolean;
  onMapUnload?: () => void;
}

export function MapCanvas({
  onMapLoad,
  onMapClick,
  className,
  center,
  zoom,
  wazeTheme,
  dropMode = false,
  onMapUnload,
}: MapCanvasProps) {
  const scheme = useThemeStore((s) => s.scheme);
  const view = useMapStore((s) => s.view);
  const setView = useMapStore((s) => s.setView);
  const setMapError = useMapStore((s) => s.setMapError);
  const mapError = useMapStore((s) => s.mapError);

  const resolvedCenter = center ?? view.center ?? DEFAULT_CENTER;
  const resolvedZoom = zoom ?? view.zoom ?? DEFAULT_ZOOM;
  const applyTheme = wazeTheme ?? scheme === "dark";

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const onMapLoadRef = useRef(onMapLoad);
  const onMapUnloadRef = useRef(onMapUnload);
  const onMapClickRef = useRef(onMapClick);
  const wazeThemeRef = useRef(applyTheme);
  const initialCenterRef = useRef(resolvedCenter);
  const initialZoomRef = useRef(resolvedZoom);

  useEffect(() => {
    onMapLoadRef.current = onMapLoad;
  }, [onMapLoad]);

  useEffect(() => {
    onMapUnloadRef.current = onMapUnload;
  }, [onMapUnload]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    wazeThemeRef.current = applyTheme;
  }, [applyTheme]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyleUrl(scheme),
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      attributionControl: false,
    });

    mapInstance.current = map;
    setMapError(null);

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    const loadTimer = window.setTimeout(() => {
      if (!map.loaded()) {
        setMapError(
          "Картата се зарежда бавно или не успя. Проверете връзката."
        );
      }
    }, 12_000);

    const onLoad = () => {
      window.clearTimeout(loadTimer);
      setMapError(null);
      if (wazeThemeRef.current) {
        applyWazeMapTheme(map);
      }
      onMapLoadRef.current?.(map);
    };

    map.on("load", onLoad);
    map.on("error", () => {
      setMapError("Картата не можа да се зареди. Опитайте отново.");
    });
    map.on("moveend", () => {
      const c = map.getCenter();
      setView({ center: [c.lng, c.lat], zoom: map.getZoom() });
    });

    map.on("click", (event) => {
      onMapClickRef.current?.({
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
      });
    });

    return () => {
      window.clearTimeout(loadTimer);
      onMapUnloadRef.current?.();
      map.remove();
      mapInstance.current = null;
    };
    // Recreate the map when the style theme changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !center) return;
    const [lng, lat] = center;
    const current = map.getCenter();
    if (current.lng !== lng || current.lat !== lat) {
      map.setCenter(center);
    }
  }, [center]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || zoom === undefined) return;
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom);
    }
  }, [zoom]);

  useEffect(() => {
    const canvas = mapInstance.current?.getCanvas();
    if (!canvas) return;
    canvas.style.cursor = dropMode ? "crosshair" : "";
  }, [dropMode]);

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div
        ref={mapContainer}
        className="absolute inset-0"
        role="application"
        aria-label="Карта"
      />
      {mapError && (
        <div className="absolute inset-x-4 top-1/3 z-20 mx-auto max-w-sm rounded-2xl waze-panel p-4 text-center">
          <p className="text-sm text-[var(--waze-text)]">{mapError}</p>
          <button
            type="button"
            className="waze-btn-primary mt-3 px-4 py-2 text-sm"
            onClick={() => window.location.reload()}
          >
            Презареди
          </button>
        </div>
      )}
    </div>
  );
}
