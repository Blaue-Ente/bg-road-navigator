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

interface RestAreaCardProps {
  name: string;
  location: string;
  facilities: string[];
  distanceKm: number;
  coords: { lng: number; lat: number };
}

const FACILITIES: Record<string, { label: string; Icon: LucideIcon }> = {
  toilet: { label: "Тоалетна", Icon: Bath },
  shower: { label: "Душ", Icon: Droplets },
  restaurant: { label: "Ресторант", Icon: Utensils },
  fuel: { label: "Гориво", Icon: Fuel },
  parking: { label: "Паркинг", Icon: SquareParking },
  wifi: { label: "Wi-Fi", Icon: Wifi },
  ev_charging: { label: "EV заряд", Icon: Plug },
};

export function RestAreaCard({
  name,
  location,
  facilities,
  distanceKm,
  coords,
}: RestAreaCardProps) {
  return (
    <div className="waze-panel p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--waze-text)]">{name}</h3>
          <p className="text-sm text-[var(--waze-text-secondary)]">
            {location}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--waze-accent-muted)] px-2.5 py-1 text-xs font-medium text-[var(--waze-accent)]">
          {distanceKm > 0 ? `${distanceKm.toFixed(1)} км` : "по маршрута"}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {facilities.map((facility) => {
          const meta = FACILITIES[facility];
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
        Отвори в Maps
      </a>
    </div>
  );
}
