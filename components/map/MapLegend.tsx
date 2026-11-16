"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMapStore } from "@/lib/stores/map.store";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { theme } from "@/lib/constants/theme";
import { hazardLabel } from "@/lib/hazards/present";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { RoadHazardKind } from "@/lib/hazards/types";
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

function LegendGroupHeading({ children }: { children: string }) {
  return (
    <p className="mt-2 first:mt-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
      {children}
    </p>
  );
}

function LegendRow({
  color,
  label,
  line,
  diamond,
  triangle,
  ring,
}: {
  color: string;
  label: string;
  line?: boolean;
  diamond?: boolean;
  triangle?: boolean;
  ring?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--waze-text-secondary)]">
      <span
        className={
          line
            ? "h-1 w-8 shrink-0 rounded-full"
            : diamond
              ? "h-3 w-3 shrink-0 rotate-45"
              : triangle
                ? "h-3 w-3 shrink-0"
                : ring
                  ? "box-border h-3 w-3 shrink-0 rounded-full border-2 border-white"
                  : "h-3 w-3 shrink-0 rounded-full"
        }
        style={
          triangle
            ? {
                backgroundColor: color,
                clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              }
            : { backgroundColor: color }
        }
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function MapLegend() {
  const m = useMessages();
  const locale = useLocale();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const layersPanelOpen = useMapStore((s) => s.layersPanelOpen);
  const setLayersPanelOpen = useMapStore((s) => s.setLayersPanelOpen);
  const hasAlt = useRouteStore((s) => s.alternativeRoutes.length > 0);
  const plan = useRouteStore((s) => s.tripPlan);
  const hotspotsOn = useMapStore((s) => s.layers.hotspots);
  const hazardKinds = useMemo(() => {
    const kinds = new Set<RoadHazardKind>();
    for (const hazard of plan?.road_hazards ?? []) kinds.add(hazard.kind);
    return [...kinds];
  }, [plan?.road_hazards]);

  const showHotspotGroup = hotspotsOn;
  const showHazardGroup = hazardKinds.length > 0;

  useEffect(() => {
    if (layersPanelOpen && detailsRef.current?.open) {
      detailsRef.current.open = false;
    }
  }, [layersPanelOpen]);

  return (
    <details
      ref={detailsRef}
      data-overlay-slot="legend"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          setLayersPanelOpen(false);
        }
      }}
      className="pointer-events-auto waze-panel w-auto max-w-[min(16rem,calc(100vw-11rem))] shrink px-3 py-2 shadow-sm md:max-w-[21rem]"
    >
      <summary
        data-tap="legend-summary"
        className="focus-ring inline-flex min-h-11 cursor-pointer list-none items-center rounded-md text-sm font-semibold text-[var(--waze-text)] marker:content-none [&::-webkit-details-marker]:hidden"
      >
        {m.map.legend}
      </summary>
      <div className="mt-2 flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto border-t border-[var(--waze-border)] pt-2">
        <LegendRow color={theme.routeLine} label={m.map.routeChosen} line />
        {hasAlt && (
          <LegendRow color={theme.routeAlt[0]} label={m.map.routeAlt} line />
        )}

        {showHotspotGroup && (
          <>
            <LegendGroupHeading>{m.map.groupSections}</LegendGroupHeading>
            {HOTSPOT_KEYS.map((key, index) => (
              <LegendRow
                key={key}
                color={HOTSPOT_COLORS[index]!}
                label={m.map[key]}
                ring
              />
            ))}
          </>
        )}

        {showHazardGroup && (
          <>
            <LegendGroupHeading>{m.map.groupHazards}</LegendGroupHeading>
            {hazardKinds.map((kind) => (
              <LegendRow
                key={kind}
                color={HAZARD_COLOR[kind]}
                label={hazardLabel(kind, locale)}
                diamond
              />
            ))}
          </>
        )}

        <LegendGroupHeading>{m.map.groupIncidents}</LegendGroupHeading>
        {TRAFFIC_KEYS.map((key, index) => (
          <LegendRow
            key={key}
            color={TRAFFIC_COLORS[index]!}
            label={m.map[key]}
            triangle
          />
        ))}

        <p className="mt-1 text-[11px] leading-snug text-[var(--waze-text-muted)]">
          {m.map.bilingualHint}
        </p>
      </div>
    </details>
  );
}