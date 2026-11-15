"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import type { FuelStation } from "@/types/fuel.types";
import { FavoritePlaceButton } from "@/components/favorites/FavoritePlaceButton";

interface FuelStationCardProps {
  station: FuelStation;
  onSelect?: (station: FuelStation) => void;
}

export function FuelStationCard({ station, onSelect }: FuelStationCardProps) {
  const m = useMessages();
  const stationStatus =
    station.open === true
      ? { label: m.fuel.msgd723e45001, style: "bg-emerald-500/20 text-[var(--waze-ok)]" }
      : station.open === false
        ? { label: m.fuel.msg7590702c01, style: "bg-red-500/20 text-[var(--waze-danger)]" }
        : {
            label: m.fuel.msg713e4ad45b,
            style: "bg-slate-500/20 text-slate-300",
          };

  return (
    <div
      className="waze-panel cursor-pointer p-4 transition hover:ring-1 hover:ring-[var(--waze-accent)]/40"
      onClick={() => onSelect?.(station)}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--waze-text)]">
            {station.brand}
          </h3>
          <p className="text-sm text-[var(--waze-text-secondary)]">
            {station.name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${stationStatus.style}`}
        >
          {stationStatus.label}
        </span>
      </div>

      <p className="mb-3 text-sm text-[var(--waze-text-secondary)]">
        {station.address}
      </p>

      <div className="grid grid-cols-3 gap-2 text-sm">
        {station.prices.diesel && (
          <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-2">
            <span className="text-xs text-[var(--waze-text-muted)]">{m.fuel.msga5ed481eca}</span>
            <div className="font-semibold text-[var(--waze-text)]">
              {station.prices.diesel.toFixed(2)} лв
            </div>
          </div>
        )}
        {station.prices.petrol95 && (
          <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-2">
            <span className="text-xs text-[var(--waze-text-muted)]">{m.fuel.msg84992a8437}</span>
            <div className="font-semibold text-[var(--waze-text)]">
              {station.prices.petrol95.toFixed(2)} лв
            </div>
          </div>
        )}
        {station.prices.lpg && (
          <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-2">
            <span className="text-xs text-[var(--waze-text-muted)]">{m.fuel.msg5d1111cb05}</span>
            <div className="font-semibold text-[var(--waze-text)]">
              {station.prices.lpg.toFixed(2)} лв
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[var(--waze-text-muted)]">
        <span>{station.distance_km.toFixed(1)} км</span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <FavoritePlaceButton
            label={`${station.brand} ${station.name}`.trim()}
            category="fuel"
            place={{
              coords: station.coords,
              address: station.address,
              brand: station.brand,
              external_id: station.id,
            }}
          />
          {station.payment_methods.map((method) => (
            <span
              key={method}
              className="rounded-full bg-[var(--waze-surface-elevated)] px-2 py-0.5"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
