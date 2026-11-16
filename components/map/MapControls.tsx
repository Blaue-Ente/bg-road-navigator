"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { catalog } from "@/lib/i18n/locale";

import { useCallback, type ReactNode } from "react";
import type { Map } from "maplibre-gl";
import {
  useGeolocation,
  locateStatusMessageCode,
} from "@/lib/hooks/useGeolocation";
import { LocateIcon, PlusIcon, MinusIcon } from "@/components/icons/NavIcons";
import { LayerPanel } from "@/components/map/LayerPanel";
import { useMapStore } from "@/lib/stores/map.store";

export interface MapControlsProps {
  map: Map | null;
}

function ControlButton({
  onClick,
  label,
  children,
  accent,
  busy,
  expanded,
  "data-tap": dataTap,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  accent?: boolean;
  busy?: boolean;
  expanded?: boolean;
  "data-tap"?: string;
}) {
  return (
    <button
      type="button"
      data-tap={dataTap}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition active:scale-95 ${
        accent
          ? "border-transparent bg-[var(--waze-accent)] text-white"
          : "border-[var(--waze-border)] bg-[var(--waze-surface)] text-[var(--waze-text)]"
      }`}
      aria-label={label}
      aria-busy={busy || undefined}
      aria-expanded={expanded}
    >
      {children}
    </button>
  );
}

export function MapControls({ map }: MapControlsProps) {
  const m = useMessages();
  const locale = useLocale();
  const { getCurrentLocation } = useGeolocation();
  const locateStatus = useMapStore((s) => s.locateStatus);
  const layersOpen = useMapStore((s) => s.layersPanelOpen);
  const setLayersPanelOpen = useMapStore((s) => s.setLayersPanelOpen);
  const geoCode = locateStatusMessageCode(locateStatus);
  const message = geoCode ? catalog(locale).location.geo[geoCode] : null;

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

  const toggleLayers = useCallback(() => {
    setLayersPanelOpen(!layersOpen);
  }, [layersOpen, setLayersPanelOpen]);

  return (
    <>
      {layersOpen ? (
        <button
          type="button"
          data-tap="layers-backdrop"
          className="fixed inset-x-0 z-[35] bg-transparent max-md:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] max-md:top-[calc(5.75rem+env(safe-area-inset-top,0px))] md:hidden"
          aria-label={m.nav.close}
          onClick={() => setLayersPanelOpen(false)}
        />
      ) : null}

      <div
        className="absolute right-3 z-30 flex flex-col items-end gap-2"
        style={{ top: "calc(5.25rem + env(safe-area-inset-top, 0px))" }}
      >
        <ControlButton onClick={zoomIn} label={m.mapControls.zoomIn}>
          <PlusIcon size={20} />
        </ControlButton>
        <ControlButton onClick={zoomOut} label={m.mapControls.zoomOut}>
          <MinusIcon size={20} />
        </ControlButton>
        <ControlButton
          onClick={locate}
          label={m.mapControls.myLocation}
          accent
          busy={locateStatus === "locating"}
        >
          <LocateIcon size={20} />
        </ControlButton>
        <ControlButton
          onClick={toggleLayers}
          label={m.mapControls.layers}
          expanded={layersOpen}
          data-tap="layers-toggle"
        >
          <span className="text-sm font-bold" aria-hidden>
            ≡
          </span>
        </ControlButton>

        {layersOpen ? (
          <div
            data-tap="layers-panel-desktop"
            className="relative z-[50] hidden w-[min(18rem,calc(100vw-1.5rem))] md:block"
            style={{
              maxHeight:
                "min(70vh, calc(100dvh - 9rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))",
            }}
          >
            <LayerPanel />
          </div>
        ) : null}

        {message && (
          <p
            className="mt-1 max-w-[11rem] rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-2 py-1 text-xs leading-snug text-[var(--waze-text-secondary)]"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </div>

      {layersOpen ? (
        <div
          data-tap="layers-panel-mobile"
          className="pointer-events-auto fixed right-3 z-[50] max-md:block md:hidden"
          style={{
            top: "calc(5.75rem + env(safe-area-inset-top, 0px))",
            maxHeight:
              "calc(100dvh - 5.75rem - 4.75rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 0.5rem)",
            width: "min(18rem, calc(100vw - 1.5rem))",
          }}
        >
          <LayerPanel scrollable />
        </div>
      ) : null}
    </>
  );
}