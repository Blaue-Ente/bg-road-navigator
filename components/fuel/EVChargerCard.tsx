import type { EVStation } from "@/types/fuel.types";

interface EVChargerCardProps {
  station: EVStation;
  onSelect?: (station: EVStation) => void;
}

export function EVChargerCard({ station, onSelect }: EVChargerCardProps) {
  return (
    <div
      className="waze-panel cursor-pointer p-4 transition hover:ring-1 hover:ring-[var(--waze-accent)]/40"
      onClick={() => onSelect?.(station)}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--waze-text)]">{station.name}</h3>
          <p className="text-sm text-[var(--waze-text-secondary)]">{station.operator}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            station.available
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {station.available ? "Свободен" : "Зает"}
        </span>
      </div>

      <p className="mb-3 text-sm text-[var(--waze-text-secondary)]">{station.address}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {station.connector_types.map((type) => (
          <span
            key={type}
            className="rounded-full bg-[var(--waze-accent-muted)] px-2 py-0.5 text-xs text-[var(--waze-accent)]"
          >
            {type}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-2">
          <span className="text-xs text-[var(--waze-text-muted)]">kW</span>
          <div className="font-semibold">{station.power_kw}</div>
        </div>
        {station.price_kwh && (
          <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-2">
            <span className="text-xs text-[var(--waze-text-muted)]">лв/kWh</span>
            <div className="font-semibold">{station.price_kwh.toFixed(2)}</div>
          </div>
        )}
        <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-2">
          <span className="text-xs text-[var(--waze-text-muted)]">км</span>
          <div className="font-semibold">{station.distance_km.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
