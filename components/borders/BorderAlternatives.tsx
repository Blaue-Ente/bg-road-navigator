"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import Link from "next/link";
import { formatTemplate } from "@/lib/i18n/format-template";
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
  const m = useMessages();
  const alternatives = rankBorderAlternatives(border, allBorders);
  if (alternatives.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">{m.borders.msga5da45f9cd}</p>
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
                  <span className="ml-2 text-[10px] font-semibold uppercase text-[var(--waze-ok)]">{m.borders.msg48e3fbe2b0}</span>
                )}
              </p>
              {wait_delta_min > 0 && (
                <p className="text-[11px] text-[var(--waze-text-muted)]">
                  {formatTemplate(m.bordersUi.waitLessThanCurrent, {
                    minutes: String(wait_delta_min),
                    minUnit: m.units.min,
                  })}
                </p>
              )}
            </div>
            <BorderWaitBadge waitMinutes={crossing.wait_time_cars} compact />
          </li>
        ))}
      </ul>
      <Link
        href="/borders"
        className="mt-2 inline-block text-xs text-[var(--waze-accent-text)] hover:underline"
      >{m.borders.msga4518455ef}</Link>
    </div>
  );
}
