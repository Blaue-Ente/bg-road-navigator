"use client";

import { useState } from "react";
import {
  LONG_HAUL_TIPS,
  CATEGORY_LABELS,
  type TravelTip,
} from "@/lib/constants/travel-tips";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TravelTip["category"][];

export default function TipsPage() {
  const [filter, setFilter] = useState<TravelTip["category"] | "all">("all");

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
          subtitle="Граници, гориво, почивки и безопасност при дълги пътувания"
        />

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`waze-chip ${filter === "all" ? "waze-chip-active" : ""}`}
          >
            Всички
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
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
              className={`ring-1 ${priorityStyles[tip.priority]}`}
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
