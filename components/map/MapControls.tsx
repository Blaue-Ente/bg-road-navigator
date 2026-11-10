"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { Map } from "maplibre-gl";
import {
  useGeolocation,
  locateStatusMessage,
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
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  accent?: boolean;
  busy?: boolean;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
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
  const { getCurrentLocation } = useGeolocation();
  const locateStatus = useMapStore((s) => s.locateStatus);
  const [layersOpen, setLayersOpen] = useState(false);
  const message = locateStatusMessage(locateStatus);

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
    <div
      className="absolute right-3 z-20 flex flex-col items-end gap-2"
      style={{ top: "calc(5.25rem + env(safe-area-inset-top, 0px))" }}
    >
      <ControlButton onClick={zoomIn} label="Приближи">
        <PlusIcon size={20} />
      </ControlButton>
      <ControlButton onClick={zoomOut} label="Отдалечи">
        <MinusIcon size={20} />
      </ControlButton>
      <ControlButton
        onClick={locate}
        label="Намери ме"
        accent
        busy={locateStatus === "locating"}
      >
        <LocateIcon size={20} />
      </ControlButton>
      <ControlButton
        onClick={() => setLayersOpen((open) => !open)}
        label="Слоеве"
        expanded={layersOpen}
      >
        <span className="text-sm font-bold" aria-hidden>
          ≡
        </span>
      </ControlButton>
      {layersOpen && <LayerPanel />}
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
  );
}
