"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";

import { formatTemplate } from "@/lib/i18n/format-template";
import { estimateRouteFuel } from "@/lib/utils/fuel-estimate";
import { useUserStore } from "@/lib/stores/user.store";

export function FuelEstimateCard({ distanceKm }: { distanceKm: number }) {
  const m = useMessages();
  const locale = useLocale();
  const profile = useUserStore((s) => s.profile);
  const estimate = estimateRouteFuel(distanceKm, profile, locale);

  if (!estimate) return null;

  return (
    <div className="waze-panel p-4">
      <h3 className="mb-1 text-sm font-semibold text-[var(--waze-text)]">{m.fuelEstimate.title}</h3>
      <p className="mb-2 text-xs text-[var(--waze-text-muted)]">{m.fuelEstimate.disclaimer}</p>
      <p className="text-lg font-semibold text-[var(--waze-text)]">
        {formatTemplate(m.fuelEstimate.costLine, {
          amount: String(estimate.fuel_needed),
          unit: estimate.unit,
          cost: estimate.cost_eur_formatted,
        })}
      </p>
      <p className="mt-1 text-xs text-[var(--waze-text-secondary)]">
        {formatTemplate(m.fuelEstimate.consumptionLine, {
          consumption: String(estimate.consumption_per_100),
          unit: estimate.unit,
          km: m.units.km,
          priceLabel: estimate.price_label,
          price: estimate.price_per_unit.toFixed(2),
        })}
      </p>
      <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
        {estimate.disclaimer_bg}
      </p>
    </div>
  );
}