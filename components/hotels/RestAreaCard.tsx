"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bath,
  Droplets,
  Fuel,
  Plug,
  SquareParking,
  Utensils,
  Wifi,
} from "lucide-react";
import { useMessages } from "@/components/i18n/LocaleProvider";

interface RestAreaCardProps {
  name: string;
  location: string;
  facilities: string[];
  distanceKm: number;
  coords: { lng: number; lat: number };
}

export function RestAreaCard({
  name,
  location,
  facilities,
  distanceKm,
  coords,
}: RestAreaCardProps) {
  const m = useMessages();
  const facilitiesMeta = useMemo(
    (): Record<string, { label: string; Icon: LucideIcon }> => ({
      toilet: { label: m.hotels.msg0df8d03bf8, Icon: Bath },
      shower: { label: m.hotels.msgea9ba450b9, Icon: Droplets },
      restaurant: { label: m.hotels.msg7e6eac764a, Icon: Utensils },
      fuel: { label: m.hotels.msg6d8b2c16c8, Icon: Fuel },
      parking: { label: m.hotels.msgcba3a4d179, Icon: SquareParking },
      wifi: { label: "Wi-Fi", Icon: Wifi },
      ev_charging: { label: m.hotels.ev7b31, Icon: Plug },
    }),
    [m]
  );

  return (
    <div className="waze-panel p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--waze-text)]">{name}</h3>
          <p className="text-sm text-[var(--waze-text-secondary)]">
            {location}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--waze-accent-muted)] px-2.5 py-1 text-xs font-medium text-[var(--waze-accent-text)]">
          {distanceKm > 0
            ? `${distanceKm.toFixed(1)}${m.units.kmPrefix}`
            : m.hotels.msg41b1643f5f}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {facilities.map((facility) => {
          const meta = facilitiesMeta[facility];
          const Icon = meta?.Icon;
          return (
            <span
              key={facility}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--waze-surface-elevated)] px-2 py-0.5 text-xs text-[var(--waze-text-secondary)]"
            >
              {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} /> : null}
              {meta?.label ?? facility}
            </span>
          );
        })}
      </div>

      <a
        href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="waze-btn-secondary block w-full py-2.5 text-center text-sm"
      >
        {m.hotels.maps3c51}
      </a>
    </div>
  );
}