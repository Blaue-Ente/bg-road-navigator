"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { VignetteLinks } from "@/components/vignettes/VignetteLinks";
import { WazeCard } from "@/components/ui/WazeCard";
import { getRouteTolls } from "@/lib/utils/route-tolls";
import type { Route } from "@/types/route.types";

interface RouteTollsCardProps {
  route: Route;
}

export function RouteTollsCard({ route }: RouteTollsCardProps) {
  const m = useMessages();
  const tolls = getRouteTolls(route);

  if (tolls.length === 0) {
    return (
      <WazeCard>
        <h3 className="text-sm font-semibold text-[var(--waze-text)]">{m.route.msgb8b87ce603}</h3>
        <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">{m.route.msg1a53944e55}</p>
      </WazeCard>
    );
  }

  return (
    <VignetteLinks
      links={tolls}
      title={m.route.msgb8b87ce603}
      intro={m.route.msg887c5d1be4}
    />
  );
}
