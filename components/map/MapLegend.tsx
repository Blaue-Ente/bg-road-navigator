"use client";

import { theme } from "@/lib/constants/theme";
import { useRouteStore } from "@/lib/stores/route.store";

const TRAFFIC_LEGEND = [
  { key: "critical", color: "#C0392B", label: "Тежък инцидент" },
  { key: "major", color: "#E74C3C", label: "Голямо забавяне" },
  { key: "moderate", color: "#F39C12", label: "Умерено" },
  { key: "minor", color: "#27AE60", label: "Леко" },
] as const;

function LegendRow({
  color,
  label,
  line,
}: {
  color: string;
  label: string;
  line?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--waze-text-secondary)]">
      <span
        className={line ? "h-1 w-8 shrink-0 rounded-full" : "h-3 w-3 shrink-0 rounded-full"}
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function MapLegend() {
  const hasAlt = useRouteStore((s) => s.alternativeRoutes.length > 0);

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