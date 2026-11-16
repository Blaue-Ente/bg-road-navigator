"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

const ATTRIBUTION_LINKS = [
  { href: "https://openfreemap.org", label: "OpenFreeMap" },
  { href: "https://openmaptiles.org", label: "OpenMapTiles" },
  {
    href: "https://www.openstreetmap.org/copyright",
    label: "OpenStreetMap",
  },
] as const;

export function MapAttributionButton() {
  const m = useMessages();

  return (
    <details
      data-overlay-slot="map-attribution"
      className="pointer-events-auto group relative shrink-0"
    >
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 text-[11px] font-medium text-[var(--waze-text-secondary)] shadow marker:content-none [&::-webkit-details-marker]:hidden">
        {m.map.osmAttributionShort}
      </summary>
      <div
        id="map-basemap-attribution"
        className="absolute bottom-full left-0 z-30 mb-2 w-[min(20rem,calc(100vw-6rem))] rounded-lg border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2 text-[11px] leading-snug text-[var(--waze-text-secondary)] shadow"
      >
        <p className="flex flex-wrap items-center gap-x-1 gap-y-1">
          <a
            href={ATTRIBUTION_LINKS[0].href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--waze-accent-text)] underline"
          >
            {ATTRIBUTION_LINKS[0].label}
          </a>
          <span aria-hidden className="text-[var(--waze-text-muted)]">
            ©
          </span>
          <a
            href={ATTRIBUTION_LINKS[1].href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--waze-accent-text)] underline"
          >
            {ATTRIBUTION_LINKS[1].label}
          </a>
          <span className="text-[var(--waze-text-muted)]">
            {m.map.attributionDataFrom}{" "}
          </span>
          <a
            href={ATTRIBUTION_LINKS[2].href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--waze-accent-text)] underline"
          >
            {ATTRIBUTION_LINKS[2].label}
          </a>
        </p>
      </div>
    </details>
  );
}