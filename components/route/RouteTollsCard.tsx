"use client";

import { VignetteLinks } from "@/components/vignettes/VignetteLinks";
import { WazeCard } from "@/components/ui/WazeCard";
import { getRouteTolls } from "@/lib/utils/route-tolls";
import type { Route } from "@/types/route.types";

interface RouteTollsCardProps {
  route: Route;
}

export function RouteTollsCard({ route }: RouteTollsCardProps) {
  const tolls = getRouteTolls(route);

  if (tolls.length === 0) {
    return (
      <WazeCard>
        <h3 className="text-sm font-semibold text-[var(--waze-text)]">
          Такси по маршрута
        </h3>
        <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
          Няма винетка или километричен тол за държавите по този маршрут.
        </p>
      </WazeCard>
    );
  }

  return (
    <VignetteLinks
      links={tolls}
      title="Такси по маршрута"
      intro="Само държавите, през които минава маршрутът. Винетката важи за период, а толът на километър се плаща по изминато разстояние."
    />
  );
}
