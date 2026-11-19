"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import {
  CONNECTOR_GROUPS,
  FUEL_FILTER_CODES,
  POWER_STEPS_KW,
  type ConnectorGroup,
} from "@/lib/fuel/filters";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { FuelTypeCode } from "@/types/fuel.types";

export interface FuelFilterState {
  fuels: FuelTypeCode[];
  minKw: number;
  connectors: ConnectorGroup[];
}

export const EMPTY_FUEL_FILTER: FuelFilterState = { fuels: [], minKw: 0, connectors: [] };

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-full px-4 text-sm font-medium ${
        active
          ? "bg-[var(--waze-accent)] text-white"
          : "bg-[var(--waze-surface-elevated)] text-[var(--waze-text)] ring-1 ring-[var(--waze-border)]"
      }`}
    >
      {children}
    </button>
  );
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** Chips to narrow the fuel list by fuel type and the charger list by power and plug. */
export function FuelFilterBar({
  value,
  onChange,
}: {
  value: FuelFilterState;
  onChange: (next: FuelFilterState) => void;
}) {
  const m = useMessages();
  const active =
    value.fuels.length > 0 || value.minKw > 0 || value.connectors.length > 0;
  return (
    <div className="mb-6 space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-text-muted)]">
          {m.fuelFilter.fuelTitle}
        </p>
        <div className="flex flex-wrap gap-2">
          {FUEL_FILTER_CODES.map((code) => (
            <Chip
              key={code}
              active={value.fuels.includes(code)}
              onClick={() => onChange({ ...value, fuels: toggle(value.fuels, code) })}
            >
              {m.fuelFilter.fuel[code]}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-text-muted)]">
          {m.fuelFilter.chargeTitle}
        </p>
        <div className="flex flex-wrap gap-2">
          {POWER_STEPS_KW.map((kw) => (
            <Chip key={kw} active={value.minKw === kw} onClick={() => onChange({ ...value, minKw: kw })}>
              {kw === 0 ? m.fuelFilter.anyPower : formatTemplate(m.fuelFilter.minPower, { kw: String(kw) })}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONNECTOR_GROUPS.map((group) => (
            <Chip
              key={group}
              active={value.connectors.includes(group)}
              onClick={() => onChange({ ...value, connectors: toggle(value.connectors, group) })}
            >
              {m.fuelFilter.plug[group]}
            </Chip>
          ))}
        </div>
      </div>
      {active ? (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FUEL_FILTER)}
          className="min-h-11 text-sm text-[var(--waze-accent-text)]"
        >
          {m.fuelFilter.clear}
        </button>
      ) : null}
    </div>
  );
}
