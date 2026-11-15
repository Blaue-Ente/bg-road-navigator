"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { estimateRouteFuel } from "@/lib/utils/fuel-estimate";
import { useUserStore } from "@/lib/stores/user.store";

export function FuelEstimateCard({ distanceKm }: { distanceKm: number }) {
  const m = useMessages();
  const profile = useUserStore((s) => s.profile);
  const estimate = estimateRouteFuel(distanceKm, profile);

  if (!estimate) return null;

  return (
    <div className="waze-panel p-4">
      <h3 className="mb-1 text-sm font-semibold text-[var(--waze-text)]">{m.fuelEstimate.title}</h3>
      <p className="mb-2 text-xs text-[var(--waze-text-muted)]">{m.fuelEstimate.disclaimer}</p>
      <p className="text-lg font-semibold text-[var(--waze-text)]">
        {estimate.fuel_needed} {estimate.unit} · ≈ {estimate.cost_bgn} лв
      </p>
      <p className="mt-1 text-xs text-[var(--waze-text-secondary)]">
        {estimate.consumption_per_100} {estimate.unit}/100 км ·{" "}
        {estimate.price_label} {estimate.price_per_unit.toFixed(2)}
      </p>
      <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
        {estimate.disclaimer_bg}
      </p>
    </div>
  );
}
