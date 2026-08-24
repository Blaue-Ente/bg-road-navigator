"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CATEGORY_LABELS } from "@/lib/constants/travel-tips";
import { useHomeStore } from "@/lib/stores/home.store";
import { useUserStore } from "@/lib/stores/user.store";
import { buildHomeBriefing } from "@/lib/utils/home-briefing";
import type { Route } from "@/types/route.types";
import { MapsHandoffButtons } from "@/components/route/MapsHandoffButtons";
import { VignetteLinks } from "@/components/vignettes/VignetteLinks";
import { WazeCard } from "@/components/ui/WazeCard";

interface HomeBriefingCardProps {
  route: Route;
}

export function HomeBriefingCard({ route }: HomeBriefingCardProps) {
  const homeCityId = useHomeStore((s) => s.homeCityId);
  const vehicleType = useUserStore((s) => s.profile?.vehicle_type);
  const briefing = useMemo(
    () => buildHomeBriefing(route, { homeCityId, vehicleType }),
    [route, homeCityId, vehicleType]
  );

  return (
    <WazeCard className="border-[var(--waze-accent)]/25 bg-[var(--waze-accent-muted)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-accent)]">
        {briefing.isGoingHome ? "Как да се приберете" : "Как да стигнете"}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-[var(--waze-text)]">
        {briefing.heading}
      </h2>
      <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
        {briefing.summary}
      </p>
      <p className="mt-3 rounded-xl bg-[var(--waze-surface)] px-3 py-2.5 text-sm leading-relaxed text-[var(--waze-text)]">
        {briefing.nextAction}
      </p>

      <div className="mt-4">
        <MapsHandoffButtons route={route}>
          <Link href="/" className="waze-btn-secondary px-4 py-2 text-sm">
            Виж на картата
          </Link>
        </MapsHandoffButtons>
      </div>

      <ol className="mt-5 space-y-2">
        {briefing.checklist.map((item, index) => (
          <li key={item.id}>
            {item.href ? (
              <Link
                href={item.href}
                className="flex gap-3 rounded-xl bg-[var(--waze-surface)] px-3 py-2.5 transition hover:ring-1 hover:ring-[var(--waze-accent)]/35"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--waze-accent-muted)] text-xs font-bold text-[var(--waze-accent)]">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium text-[var(--waze-text)]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--waze-text-secondary)]">
                    {item.detail}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="flex gap-3 rounded-xl bg-[var(--waze-surface)] px-3 py-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--waze-accent-muted)] text-xs font-bold text-[var(--waze-accent)]">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium text-[var(--waze-text)]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--waze-text-secondary)]">
                    {item.detail}
                  </span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>

      {briefing.tips.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-text-muted)]">
            Съвети за този път
          </p>
          {briefing.tips.map((tip) => (
            <div
              key={tip.id}
              className="rounded-xl bg-[var(--waze-surface)] px-3 py-2.5"
            >
              <p className="text-[11px] text-[var(--waze-text-muted)]">
                {CATEGORY_LABELS[tip.category]}
                {tip.priority === "high" ? " · важно" : ""}
              </p>
              <p className="text-sm font-medium text-[var(--waze-text)]">
                {tip.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--waze-text-secondary)]">
                {tip.body}
              </p>
            </div>
          ))}
          <Link
            href="/tips"
            className="inline-block text-xs text-[var(--waze-accent)] hover:underline"
          >
            Всички съвети
          </Link>
        </div>
      )}

      {briefing.vignettes.length > 0 && (
        <div className="mt-4">
          <VignetteLinks
            links={briefing.vignettes}
            title="Винетки по вашия път"
            compact
          />
        </div>
      )}
    </WazeCard>
  );
}
