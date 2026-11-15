"use client";

import { useMemo } from "react";
import { theme } from "@/lib/constants/theme";
import { HAZARD_LABEL } from "@/lib/hazards/present";
import type { RoadHazardKind } from "@/lib/hazards/types";
import { ATTENTION_TITLE } from "@/lib/hotspots/present";
import { useMapStore } from "@/lib/stores/map.store";
import { useRouteStore } from "@/lib/stores/route.store";

const TRAFFIC_LEGEND = [
  { key: "critical", color: "#C0392B", label: "Тежък инцидент" },
  { key: "major", color: "#E74C3C", label: "Голямо забавяне" },
  { key: "moderate", color: "#F39C12", label: "Умерено" },
  { key: "minor", color: "#27AE60", label: "Леко" },
] as const;

const HOTSPOT_LEGEND = [
  { key: "high", color: "#b91c1c", label: `${ATTENTION_TITLE} — висока тежест` },
  { key: "medium", color: "#d97706", label: `${ATTENTION_TITLE} — средна тежест` },
  { key: "low", color: "#ca8a04", label: `${ATTENTION_TITLE} — ниска тежест` },
] as const;

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
        Легенда
      </summary>
      <div className="mt-2 flex flex-col gap-1.5 border-t border-[var(--waze-border)] pt-2">
        <LegendRow color={theme.routeLine} label="Избран маршрут" line />
        {hasAlt && (
          <LegendRow
            color={theme.routeAlt[0]}
            label="Друг маршрут"
            line
          />
        )}
        {hotspotsOn &&
          HOTSPOT_LEGEND.map((row) => (
            <LegendRow key={row.key} color={row.color} label={row.label} />
          ))}
        {hazardKinds.map((kind) => (
          <LegendRow
            key={kind}
            color={HAZARD_COLOR[kind]}
            label={HAZARD_LABEL[kind]}
            diamond
          />
        ))}
        {TRAFFIC_LEGEND.map((row) => (
          <LegendRow key={row.key} color={row.color} label={row.label} />
        ))}
        <p className="mt-1 text-[11px] leading-snug text-[var(--waze-text-muted)]">
          Имената на градовете идват от картата и може да са на две азбуки.
        </p>
      </div>
    </details>
  );
}