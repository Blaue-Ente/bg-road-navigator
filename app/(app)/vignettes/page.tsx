"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { VignetteLinks } from "@/components/vignettes/VignetteLinks";
import { useRouteStore } from "@/lib/stores/route.store";
import { useHomeStore } from "@/lib/stores/home.store";
import { buildHomeBriefing } from "@/lib/utils/home-briefing";

export default function VignettesPage() {
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const homeCityId = useHomeStore((s) => s.homeCityId);
  const routeVignettes = useMemo(() => {
    if (!activeRoute) return [];
    return buildHomeBriefing(activeRoute, { homeCityId }).vignettes;
  }, [activeRoute, homeCityId]);

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="Винетки и тол"
          subtitle="Купете ги преди границата — само официални портали"
        />
        {routeVignettes.length > 0 ? (
          <VignetteLinks
            links={routeVignettes}
            title={`За вашия път · ${activeRoute?.origin.label} → ${activeRoute?.destination.label}`}
          />
        ) : (
          <p className="text-sm text-[var(--waze-text-secondary)]">
            Изчислете маршрут, за да видите само винетките по пътя.{" "}
            <Link href="/route" className="text-[var(--waze-accent)]">
              Път към вкъщи
            </Link>
          </p>
        )}
        <VignetteLinks title="Всички официални портали" />
      </div>
    </div>
  );
}
