"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

export function MapAttributionButton() {
  const m = useMessages();

  return (
    <a
      href="https://www.openstreetmap.org/copyright"
      target="_blank"
      rel="noopener noreferrer"
      data-overlay-slot="map-attribution"
      className="pointer-events-auto inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 text-[11px] font-medium text-[var(--waze-text-secondary)] shadow"
    >
      {m.map.osmAttributionShort}
    </a>
  );
}