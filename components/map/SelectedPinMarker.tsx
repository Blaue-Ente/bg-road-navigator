"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import { X } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { communityPinColor, communityPinLabel } from "@/lib/constants/community-pins";
import { useCommunityStore } from "@/lib/stores/community.store";

/** The signal opened from the community list: a ring on the map and a small label to dismiss. */
export function SelectedPinMarker({ map }: { map: Map | null }) {
  const locale = useLocale();
  const pin = useCommunityStore((s) => s.selectedPin);
  const setSelectedPin = useCommunityStore((s) => s.setSelectedPin);

  useEffect(() => {
    if (!map || !pin) return;
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `width:44px;height:44px;border-radius:9999px;border:4px solid ${communityPinColor(pin.category)};background:rgba(255,255,255,.25);box-shadow:0 0 0 6px rgba(255,255,255,.55);pointer-events:none`;
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([pin.coords.lng, pin.coords.lat])
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, pin]);

  if (!pin) return null;
  return (
    <div className="pointer-events-auto fixed left-1/2 top-24 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--waze-surface)] px-4 py-2 text-sm shadow-lg ring-1 ring-[var(--waze-border)]">
      <span className="truncate font-semibold text-[var(--waze-text)]">{pin.title}</span>
      <span className="shrink-0 text-xs text-[var(--waze-text-muted)]">
        {communityPinLabel(pin.category, locale)}
      </span>
      <button
        type="button"
        onClick={() => setSelectedPin(null)}
        aria-label="close"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--waze-text)]"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
