"use client";

import { useEffect, useState } from "react";
import type { Map } from "maplibre-gl";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { isMapReady } from "@/lib/map/is-map-ready";
import { useMapStore } from "@/lib/stores/map.store";

export function HotspotAttributionButton({ map }: { map: Map | null }) {
  const m = useMessages();
  const enabled = useMapStore((state) => state.layers.hotspots);
  const [credits, setCredits] = useState<string[]>([]);
  const [creditsOpen, setCreditsOpen] = useState(false);

  useEffect(() => {
    if (!enabled || !isMapReady(map)) return;

    let cancelled = false;

    const load = () => {
      if (!isMapReady(map)) return;
      const bounds = map.getBounds();
      const params = new URLSearchParams({
        west: String(bounds.getWest()),
        south: String(bounds.getSouth()),
        east: String(bounds.getEast()),
        north: String(bounds.getNorth()),
      });
      void fetch(`/api/hotspots?${params.toString()}`)
        .then((response) => (response.ok ? response.json() : null))
        .then(
          (payload: { credits?: string[] } | null) => {
            if (!payload || cancelled) return;
            setCredits(payload.credits ?? []);
          }
        )
        .catch(() => undefined);
    };

    if (map.isStyleLoaded()) load();
    else map.once("load", load);
    map.on("moveend", load);

    return () => {
      cancelled = true;
      map.off("moveend", load);
    };
  }, [map, enabled]);

  if (!enabled || credits.length === 0) return null;

  return (
    <div className="pointer-events-auto relative shrink-0" data-overlay-slot="hotspot-info">
      <button
        type="button"
        aria-label={m.map.msg741964e944}
        aria-expanded={creditsOpen}
        aria-controls="hotspot-credits"
        onClick={() => setCreditsOpen((open) => !open)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] text-sm font-semibold text-[var(--waze-text)] shadow"
      >
        i
      </button>
      {creditsOpen && (
        <div
          id="hotspot-credits"
          className="absolute bottom-full left-0 z-30 mb-2 max-h-48 w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border border-[var(--waze-border)] bg-[var(--waze-surface)] px-2 py-1 text-[11px] leading-snug text-[var(--waze-text)] shadow"
        >
          <p className="font-medium">{m.map.msg741964e944}</p>
          <ul className="mt-1 space-y-1">
            {credits.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}