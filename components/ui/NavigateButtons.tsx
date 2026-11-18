"use client";

import { Navigation } from "lucide-react";
import { useMessages } from "@/components/i18n/LocaleProvider";
import {
  appleMapsNavigateUrl,
  googleMapsNavigateUrl,
  wazeNavigateUrl,
} from "@/lib/utils/maps-handoff";
import type { GeoPoint } from "@/types/route.types";

function onApple(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent)
  );
}

/** Opens turn-by-turn to a point in the phone's own maps app, or in Waze. */
export function NavigateButtons({ point }: { point: GeoPoint }) {
  const m = useMessages();
  const apple = onApple();
  const link =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold";
  return (
    <div
      className="flex flex-wrap gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      <a
        href={
          apple ? appleMapsNavigateUrl(point) : googleMapsNavigateUrl(point)
        }
        target="_blank"
        rel="noopener noreferrer"
        className={`${link} bg-[var(--waze-accent)] text-white`}
      >
        <Navigation className="h-4 w-4" aria-hidden />
        {m.fuel.navigate}
      </a>
      <a
        href={wazeNavigateUrl(point)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${link} border border-[var(--waze-border)] text-[var(--waze-text)]`}
      >
        Waze
      </a>
    </div>
  );
}
