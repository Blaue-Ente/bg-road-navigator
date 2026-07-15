"use client";

import { useState } from "react";
import {
  LONG_HAUL_TIPS,
  CATEGORY_LABELS,
  type TravelTip,
} from "@/lib/constants/travel-tips";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TravelTip["category"][];

export default function TipsPage() {
  const [filter, setFilter] = useState<TravelTip["category"] | "all">("all");

  const tips =
    filter === "all"
      ? LONG_HAUL_TIPS
      : LONG_HAUL_TIPS.filter((t) => t.category === filter);

  const priorityColor = {
    high: "border-red-800/50 bg-red-900/20",
    medium: "border-amber-800/50 bg-amber-900/20",
    low: "border-gray-800 bg-gray-900",
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-blue-400">
          Съвети за пътуване
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Полезна информация за дълги европейски пътувания — граници, гориво,
          почивки, време и безопасност
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              filter === "all"
                ? "border-blue-500 bg-blue-600/30 text-blue-300"
                : "border-gray-700 bg-gray-900 text-gray-300"
            }`}
          >
            Всички
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                filter === cat
                  ? "border-blue-500 bg-blue-600/30 text-blue-300"
                  : "border-gray-700 bg-gray-900 text-gray-300"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tips.map((tip) => (
            <article
              key={tip.id}
              className={`rounded-lg border p-4 ${priorityColor[tip.priority]}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {CATEGORY_LABELS[tip.category]}
                </span>
                {tip.priority === "high" && (
                  <span className="text-[10px] text-red-400">важно</span>
                )}
              </div>
              <h2 className="font-semibold text-gray-100">{tip.title}</h2>
              <p className="mt-1 text-sm text-gray-400">{tip.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
