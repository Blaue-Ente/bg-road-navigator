"use client";

import { useMemo } from "react";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { theme } from "@/lib/constants/theme";
import { HAZARD_LABEL } from "@/lib/hazards/present";
import type { RoadHazardKind } from "@/lib/hazards/types";
import { useMapStore } from "@/lib/stores/map.store";
import { useRouteStore } from "@/lib/stores/route.store";

const TRAFFIC_KEYS = [
  "trafficCritical",
  "trafficMajor",
  "trafficModerate",
  "trafficMinor",
] as const;

const TRAFFIC_COLORS = ["#C0392B", "#E74C3C", "#F39C12", "#27AE60"] as const;

const HOTSPOT_KEYS = [
  "hotspotHigh",
  "hotspotMedium",
  "hotspotLow",
] as const;

const HOTSPOT_COLORS = ["#b91c1c", "#d97706", "#ca8a04"] as const;

const HAZARD_COLOR: Record<RoadHazardKind, string> = {
  roadworks: "#d97706",
  closed: "#b91c1c",
  danger: "#c2410c",
  conditions: "#1d4ed8",
};

function LegendRow({
  color,
  label,
  line,
  diamond,
}: {
  color: string;
  label: string;
  line?: boolean;
  diamond?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--waze-text-secondary)]">
      <span
        className={
          line
            ? "h-1 w-8 shrink-0 rounded-full"
            : diamond
              ? "h-3 w-3 shrink-0 rotate-45"
              : "h-3 w-3 shrink-0 rounded-full"
        }
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function MapLegend() {
  const m = useMessages();
  const hasAlt = useRouteStore((s) => s.alternativeRoutes.length > 0);
  const plan = useRouteStore((s) => s.tripPlan);
  const hotspotsOn = useMapStore((s) => s.layers.hotspots);
  const hazardKinds = useMemo(() => {
    const kinds = new Set<RoadHazardKind>();
    for (const hazard of plan?.road_hazards ?? []) kinds.add(hazard.kind);
    return [...kinds];
  }, [plan?.road_hazards]);

  return (
    <details className="pointer-events-auto waze-panel absolute left-3 z-20 max-w-[min(18rem,calc(100vw-6rem))] px-3 py-2 shadow-sm bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:bottom-[7.5rem] md:max-w-[21rem]">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--waze-text)] marker:content-none [&::-webkit-details-marker]:hidden">
        {m.map.legend}
      </summary>
      <div className="mt-2 flex flex-col gap-1.5 border-t border-[var(--waze-border)] pt-2">
        <LegendRow color={theme.routeLine} label={m.map.routeChosen} line />
        {hasAlt && (
          <LegendRow color={theme.routeAlt[0]} label={m.map.routeAlt} line />
        )}
        {hotspotsOn &&
          HOTSPOT_KEYS.map((key, index) => (
            <LegendRow
              key={key}
              color={HOTSPOT_COLORS[index]!}
              label={m.map[key]}
            />
          ))}
        {hazardKinds.map((kind) => (
          <LegendRow
            key={kind}
            color={HAZARD_COLOR[kind]}
            label={HAZARD_LABEL[kind]}
            diamond
          />
        ))}
        {TRAFFIC_KEYS.map((key, index) => (
          <LegendRow
            key={key}
            color={TRAFFIC_COLORS[index]!}
            label={m.map[key]}
          />
        ))}
        <p className="mt-1 text-[11px] leading-snug text-[var(--waze-text-muted)]">
          {m.map.bilingualHint}
        </p>
      </div>
    </details>
  );
}