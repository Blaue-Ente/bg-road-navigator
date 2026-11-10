"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyleUrl } from "@/lib/constants/map-style";
import { isFatalMapError } from "@/lib/map/map-error";
import { useThemeStore } from "@/lib/stores/theme.store";
import { useMapStore } from "@/lib/stores/map.store";

const DEFAULT_CENTER: [number, number] = [23.3219, 42.6977];
const DEFAULT_ZOOM = 7;

export interface MapCanvasProps {
  onMapLoad?: (map: maplibregl.Map) => void;
  onMapClick?: (coords: { lng: number; lat: number }) => void;
  onMapLongPress?: (coords: { lng: number; lat: number }) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
  dropMode?: boolean;
  onMapUnload?: () => void;
}

export function MapCanvas({
  onMapLoad,
  onMapClick,
  onMapLongPress,
  className,
  center,
  zoom,
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

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const onMapLoadRef = useRef(onMapLoad);
  const onMapUnloadRef = useRef(onMapUnload);
  const onMapClickRef = useRef(onMapClick);
  const onMapLongPressRef = useRef(onMapLongPress);
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
    onMapLongPressRef.current = onMapLongPress;
  }, [onMapClick, onMapLongPress]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const container = mapContainer.current;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: getMapStyleUrl(scheme),
        center: initialCenterRef.current,
        zoom: initialZoomRef.current,
        attributionControl: false,
      });
    } catch {
      setMapError(
        "Картата не се зареди."
      );
      return;
    }

    mapInstance.current = map;
    setMapError(null);

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    const resize = () => {
      map.resize();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const loadTimer = window.setTimeout(() => {
      if (!map.isStyleLoaded()) {
        setMapError(
          "Стилът не се зареди."
        );
      }
    }, 12_000);

    const onStyleLoad = () => {
      window.clearTimeout(loadTimer);
      setMapError(null);
      resize();
      onMapLoadRef.current?.(map);
    };

    map.on("style.load", onStyleLoad);
    map.on("error", (event) => {
      if (map.isStyleLoaded()) return;
      if (!isFatalMapError(event)) return;
      setMapError("Стилът не се зареди.");
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

    const canvas = map.getCanvas();
    const blockMenu = (event: Event) => event.preventDefault();
    canvas.addEventListener("contextmenu", blockMenu);
    map.on("contextmenu", (event) => {
      onMapLongPressRef.current?.({
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
      });
    });

    let holdTimer = 0;
    let holdStart: { x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      holdStart = { x: event.clientX, y: event.clientY };
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        const point = map.unproject([event.clientX, event.clientY]);
        onMapLongPressRef.current?.({ lng: point.lng, lat: point.lat });
      }, 550);
    };
    const cancelHold = () => {
      window.clearTimeout(holdTimer);
      holdStart = null;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!holdStart) return;
      const dx = event.clientX - holdStart.x;
      const dy = event.clientY - holdStart.y;
      if (dx * dx + dy * dy > 64) cancelHold();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", cancelHold);
    canvas.addEventListener("pointercancel", cancelHold);

    return () => {
      window.clearTimeout(loadTimer);
      window.clearTimeout(holdTimer);
      canvas.removeEventListener("contextmenu", blockMenu);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", cancelHold);
      canvas.removeEventListener("pointercancel", cancelHold);
      observer.disconnect();
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
    <div className={`relative h-[100dvh] w-full ${className ?? ""}`}>
      <div
        ref={mapContainer}
        className="absolute inset-0 h-full w-full"
        role="application"
        aria-label="Карта"
      />
      {mapError && (
        <div className="absolute top-1/3 left-1/2 z-20 w-40 -translate-x-1/2 rounded-2xl waze-panel p-3 text-center">
          <p className="truncate text-xs leading-4 text-[var(--waze-text)]">{mapError}</p>
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
