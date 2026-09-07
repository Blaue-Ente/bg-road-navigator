"use client";

import type { BorderStatus } from "@/types/border.types";
import { FavoritePlaceButton } from "@/components/favorites/FavoritePlaceButton";

interface BorderCardProps {
  border: BorderStatus;
  onComment?: () => void;
}

export function BorderCard({ border, onComment }: BorderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "border-green-500/40 bg-green-500/10";
      case "yellow":
        return "border-yellow-500/40 bg-yellow-500/10";
      case "orange":
        return "border-orange-500/40 bg-orange-500/10";
      case "red":
        return "border-red-500/40 bg-red-500/10";
      default:
        return "border-[var(--waze-border)] bg-[var(--waze-surface)]";
    }
  };

  return (
    <div className={`waze-panel p-4 ${getStatusColor(border.status)}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-[var(--waze-text)]">
          {border.name_bg}
        </h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            border.status === "green"
              ? "text-green-400"
              : border.status === "yellow"
                ? "text-yellow-400"
                : border.status === "orange"
                  ? "text-orange-400"
                  : "text-red-400"
          }`}
        >
          {border.status === "green"
            ? "< 30 мин"
            : border.status === "yellow"
              ? "30-60 мин"
              : border.status === "orange"
                ? "60-120 мин"
                : "> 120 мин"}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-xl font-bold">{border.wait_time_cars}</div>
          <div className="text-xs text-[var(--waze-text-muted)]">Машини</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{border.wait_time_trucks}</div>
          <div className="text-xs text-[var(--waze-text-muted)]">Камиони</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{border.wait_time_buses}</div>
          <div className="text-xs text-[var(--waze-text-muted)]">Автобуси</div>
        </div>
      </div>

      <div className="mb-3 text-xs text-[var(--waze-text-muted)]">
        Работи: {border.working_hours}
        {border.derived_heavy_wait && (
          <span> · камиони/автобуси са оценка</span>
        )}
      </div>

      {border.accepted_documents && border.accepted_documents.length > 0 && (
        <p className="mb-2 text-xs text-[var(--waze-text-secondary)]">
          Документи: {border.accepted_documents.join(", ")}
        </p>
      )}
      {border.notes_bg && (
        <p className="mb-3 text-xs text-[var(--waze-text-muted)]">
          {border.notes_bg}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {border.coords && (
          <FavoritePlaceButton
            label={border.name_bg}
            category="border"
            place={{
              coords: border.coords,
              subtitle: border.country_pair,
              crossing_id: border.crossing_id,
            }}
          />
        )}
        {onComment && (
          <button
            type="button"
            onClick={onComment}
            className="rounded-full bg-[var(--waze-accent-muted)] px-3 py-1.5 text-sm text-[var(--waze-accent)]"
          >
            Коментар
          </button>
        )}
      </div>
    </div>
  );
}
