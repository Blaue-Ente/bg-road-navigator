"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { formatTemplate } from "@/lib/i18n/format-template";

interface BorderStatsChartProps {
  hourlyData: number[];
  title?: string;
}

export function BorderStatsChart({
  hourlyData,
  title,
}: BorderStatsChartProps) {
  const m = useMessages();
  const resolvedTitle = title ?? m.borders.msg988aa1d065;
  const maxWait = Math.max(...hourlyData, 1);
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));

  return (
    <div className="rounded-lg border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-3">
      <h4 className="mb-1 text-sm font-medium text-[var(--waze-text)]">
        {resolvedTitle}
      </h4>
      <p className="mb-3 text-xs text-[var(--waze-text-secondary)]">
        {formatTemplate(m.borders.peakWait, {
          hour: peakHour,
          minutes: Math.round(hourlyData[peakHour]),
        })}
      </p>
      <div className="flex h-24 items-end gap-0.5">
        {hourlyData.map((wait, hour) => {
          const height = Math.max((wait / maxWait) * 100, 4);
          const isPeak = hour === peakHour;
          return (
            <div
              key={hour}
              className="group relative flex-1"
              title={formatTemplate(m.borders.hourWaitTooltip, {
                hour,
                minutes: Math.round(wait),
              })}
            >
              <div
                className={`w-full rounded-t transition-colors ${
                  isPeak
                    ? "bg-blue-500"
                    : "bg-blue-600/60 group-hover:bg-blue-500"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--waze-text-secondary)]">
        <span>0:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
