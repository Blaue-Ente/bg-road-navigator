"use client";

import { useCallback, type ReactNode } from "react";
import type { Map } from "maplibre-gl";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { LocateIcon, PlusIcon, MinusIcon } from "@/components/icons/NavIcons";

export interface MapControlsProps {
  map: Map | null;
}

function ControlButton({
  onClick,
  label,
  children,
  accent,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
        accent
          ? "bg-gradient-to-b from-[#4dd4ff] to-[#1a9fd4] text-[#0b0f14]"
          : "waze-panel text-[var(--waze-text)]"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
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
    <div
      className="absolute right-3 z-10 flex flex-col gap-2"
      style={{ top: "calc(4.5rem + env(safe-area-inset-top, 0px))" }}
    >
      <ControlButton onClick={zoomIn} label="Приближи">
        <PlusIcon />
      </ControlButton>
      <ControlButton onClick={zoomOut} label="Отдалечи">
        <MinusIcon />
      </ControlButton>
      <ControlButton onClick={locate} label="Намери ме" accent>
        <LocateIcon />
      </ControlButton>
    </div>
  );
}
