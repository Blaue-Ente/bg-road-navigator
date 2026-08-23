"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LONG_HAUL_TIPS,
  CATEGORY_LABELS,
  type TravelTip,
} from "@/lib/constants/travel-tips";
import { useRouteStore } from "@/lib/stores/route.store";
import { useHomeStore } from "@/lib/stores/home.store";
import { useUserStore } from "@/lib/stores/user.store";
import { buildHomeBriefing } from "@/lib/utils/home-briefing";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { VignetteLinks } from "@/components/vignettes/VignetteLinks";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TravelTip["category"][];

export default function TipsPage() {
  const [filter, setFilter] = useState<TravelTip["category"] | "all">("all");
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const homeCityId = useHomeStore((s) => s.homeCityId);
  const vehicleType = useUserStore((s) => s.profile?.vehicle_type);

  const routeTips = useMemo(() => {
    if (!activeRoute) return [];
    return buildHomeBriefing(activeRoute, { homeCityId, vehicleType }).tips;
  }, [activeRoute, homeCityId, vehicleType]);

  const routeTipIds = new Set(routeTips.map((tip) => tip.id));

  const tips =
    filter === "all"
      ? LONG_HAUL_TIPS
      : LONG_HAUL_TIPS.filter((t) => t.category === filter);

  const priorityStyles = {
    high: "ring-red-500/30 bg-red-500/10",
    medium: "ring-amber-500/30 bg-amber-500/10",
    low: "",
  };

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Съвети за пътуване"
          subtitle="Само каквото ви трябва, за да се приберете бързо и без глоби, опашки и умора"
        />

        {activeRoute && routeTips.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
              За вашия път · {activeRoute.origin.label} →{" "}
              {activeRoute.destination.label}
            </h2>
            <div className="space-y-3">
              {routeTips.map((tip) => (
                <WazeCard
                  key={tip.id}
                  className={`ring-1 ${priorityStyles[tip.priority]}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs text-[var(--waze-text-muted)]">
                      {CATEGORY_LABELS[tip.category]}
                    </span>
                    {tip.priority === "high" && (
                      <span className="text-[10px] font-semibold uppercase text-red-400">
                        важно сега
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[var(--waze-text)]">
                    {tip.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
                    {tip.body}
                  </p>
                </WazeCard>
              ))}
            </div>
          </section>
        )}

        {!activeRoute && (
          <WazeCard className="mb-6">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              Изчислете маршрут, за да видите само съветите за вашия път —
              винетки, граници, нощувка.
            </p>
            <Link
              href="/route"
              className="waze-btn-primary mt-3 inline-block px-4 py-2 text-sm"
            >
              Път към вкъщи
            </Link>
          </WazeCard>
        )}

        <div className="mb-6">
          <VignetteLinks compact title="Официални винетки" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`waze-chip ${filter === "all" ? "waze-chip-active" : ""}`}
          >
            Всички
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`waze-chip ${filter === cat ? "waze-chip-active" : ""}`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tips.map((tip) => (
            <WazeCard
              key={tip.id}
              className={`ring-1 ${priorityStyles[tip.priority]} ${
                routeTipIds.has(tip.id) ? "opacity-60" : ""
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs text-[var(--waze-text-muted)]">
                  {CATEGORY_LABELS[tip.category]}
                </span>
                {tip.priority === "high" && (
                  <span className="text-[10px] font-semibold uppercase text-red-400">
                    важно
                  </span>
                )}
              </div>
              <h2 className="font-semibold text-[var(--waze-text)]">{tip.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
                {tip.body}
              </p>
            </WazeCard>
          ))}
        </div>
      </div>
    </div>
  );
}
