"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import type { EmergencyData } from "@/lib/constants/emergency-numbers";

interface CountryEmergencyCardProps {
  country: EmergencyData;
}

export function CountryEmergencyCard({ country }: CountryEmergencyCardProps) {
  const m = useMessages();
  const numbers = [
    { label: m.emergency.msg8e8ced3019, value: country.police || "112" },
    { label: m.emergency.msg991c9096ff, value: country.ambulance || "112" },
    { label: m.emergency.msgf449d92080, value: country.fire || "112" },
    {
      label: m.emergency.msge3775e6db8,
      value: country.roadside_assistance || "112",
    },
  ];

  return (
    <div className="waze-panel p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl">{country.flag}</span>
        <h3 className="text-lg font-semibold text-[var(--waze-text)]">
          {country.country_bg}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {numbers.map((n) => (
          <a
            key={n.label}
            href={`tel:${n.value.replace(/\s/g, "")}`}
            className="rounded-xl bg-[var(--waze-surface-elevated)] p-2.5 transition hover:ring-1 hover:ring-[var(--waze-accent)]/30"
          >
            <p className="text-xs text-[var(--waze-text-muted)]">{n.label}</p>
            <p className="font-semibold text-[var(--waze-text)]">{n.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}