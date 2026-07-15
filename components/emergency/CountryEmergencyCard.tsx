import type { EmergencyData } from "@/lib/constants/emergency-numbers";

interface CountryEmergencyCardProps {
  country: EmergencyData;
}

export function CountryEmergencyCard({ country }: CountryEmergencyCardProps) {
  const numbers = [
    { label: "Полиция", value: country.police || "112" },
    { label: "Линейка", value: country.ambulance || "112" },
    { label: "Пожар", value: country.fire || "112" },
    { label: "Пътна помощ", value: country.roadside_assistance || "112" },
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
            <span className="block text-xs text-[var(--waze-text-muted)]">
              {n.label}
            </span>
            <span className="font-bold text-[var(--waze-accent)]">{n.value}</span>
          </a>
        ))}
      </div>

      {country.notes_bg && (
        <p className="mt-3 rounded-xl bg-[var(--waze-surface-elevated)] p-2 text-xs text-[var(--waze-text-secondary)]">
          {country.notes_bg}
        </p>
      )}
    </div>
  );
}
