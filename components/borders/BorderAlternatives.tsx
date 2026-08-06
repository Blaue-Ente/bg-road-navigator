"use client";

import Link from "next/link";
import type { BorderStatus } from "@/types/border.types";
import { rankBorderAlternatives } from "@/lib/utils/border-alternatives";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";

interface BorderAlternativesProps {
  border: BorderStatus;
  allBorders: BorderStatus[];
}

export function BorderAlternatives({
  border,
  allBorders,
}: BorderAlternativesProps) {
  const alternatives = rankBorderAlternatives(border, allBorders);
  if (alternatives.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
        Алтернативни пролази
      </p>
      <ul className="space-y-2">
        {alternatives.map(({ crossing, wait_delta_min, recommended }) => (
          <li
            key={crossing.crossing_id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--waze-text)]">
                {crossing.name_bg}
                {recommended && (
                  <span className="ml-2 text-[10px] font-semibold uppercase text-emerald-400">
                    по-бързо
                  </span>
                )}
              </p>
              {wait_delta_min > 0 && (
                <p className="text-[11px] text-[var(--waze-text-muted)]">
                  ~{wait_delta_min} мин по-малко от текущия
                </p>
              )}
            </div>
            <BorderWaitBadge waitMinutes={crossing.wait_time_cars} compact />
          </li>
        ))}
      </ul>
      <Link
        href="/borders"
        className="mt-2 inline-block text-xs text-[var(--waze-accent)] hover:underline"
      >
        Виж всички граници
      </Link>
    </div>
  );
}
