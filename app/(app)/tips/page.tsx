"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import Link from "next/link";
import {
  LONG_HAUL_TIPS,
  categoryLabel,
  tipBody,
  tipTitle,
  type TravelTip,
} from "@/lib/constants/travel-tips";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";

const CATEGORIES: TravelTip["category"][] = [
  "safety",
  "borders",
  "fuel",
  "rest",
  "weather",
  "documents",
  "ev",
];

export default function TipsPage() {
  const m = useMessages();
  const locale = useLocale();
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
          title={m.tipsPage.msgcb7f53d0f7}
          subtitle={m.tipsPage.msg383b242ccf}
        />

        <WazeCard className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--waze-text)]">{m.tipsPage.msg4980c1700f}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
            {m.tipsPage.msgc2e32f0568}
          </p>
          <Link
            href="/vignettes"
            className="mt-3 inline-flex text-sm font-medium text-[var(--waze-accent-text)] hover:underline"
          >{m.tipsPage.msgd390ac428d}</Link>
        </WazeCard>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            data-tap="tips-category-chip"
            onClick={() => setFilter("all")}
            className={`inline-flex min-h-11 items-center waze-chip ${filter === "all" ? "waze-chip-active" : ""}`}
          >{m.tipsPage.msg109b6e8542}</button>
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              data-tap="tips-category-chip"
              onClick={() => setFilter(cat)}
              className={`inline-flex min-h-11 items-center waze-chip ${filter === cat ? "waze-chip-active" : ""}`}
            >
              {categoryLabel(locale, cat)}
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
                  {categoryLabel(locale, tip.category)}
                </span>
                {tip.priority === "high" && (
                  <span className="text-[10px] font-semibold text-[var(--waze-danger)]">
                    {m.tipsPage.msg343e2ece52}
                  </span>
                )}
              </div>
              <h2 className="font-semibold text-[var(--waze-text)]">
                {tipTitle(locale, tip)}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
                {tipBody(locale, tip)}
              </p>
            </WazeCard>
          ))}
        </div>
      </div>
    </div>
  );
}
