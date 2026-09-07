"use client";

import Link from "next/link";
import { useServiceStatus } from "@/lib/hooks/useServiceStatus";
import { WazeCard } from "@/components/ui/WazeCard";

const PRIORITY_LABEL = {
  required_for_auth: "Нужен за акаунти",
  recommended: "Препоръчан",
  optional: "По избор",
} as const;

interface ServicesStatusPanelProps {
  /** Compact chips only (profile). */
  compact?: boolean;
}

export function ServicesStatusPanel({
  compact = false,
}: ServicesStatusPanelProps) {
  const { data, isLoading, isError, refetch } = useServiceStatus();

  if (isLoading) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-muted)]">
          Проверка на услугите…
        </p>
      </WazeCard>
    );
  }

  if (isError || !data) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-secondary)]">
          Статусът на услугите не може да се зареди.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm text-[var(--waze-accent)] underline"
        >
          Опитай пак
        </button>
      </WazeCard>
    );
  }

  const missing = data.services.filter((s) => !s.configured);

  return (
    <WazeCard>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--waze-text)]">
            Услуги и ключове
          </h2>
          <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
            {data.summary.configured_count}/{data.summary.total_count}{" "}
            конфигурирани · кодът е готов — остават env ключове
            {data.supabase.configured ? "" : " + Supabase SQL"}
          </p>
        </div>
        <Link
          href="/setup"
          className="text-xs font-medium text-[var(--waze-accent)] hover:underline"
        >
          Пълна настройка →
        </Link>
      </div>

      <ul className={compact ? "space-y-1.5" : "space-y-2"}>
        {data.services.map((service) => (
          <li
            key={service.id}
            className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--waze-text)]">
                {service.label}
              </p>
              {!compact && (
                <p className="text-[11px] text-[var(--waze-text-muted)]">
                  {PRIORITY_LABEL[service.priority]} · {service.unlocks}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                service.configured
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-200"
              }`}
            >
              {service.configured ? "OK" : "липсва"}
            </span>
          </li>
        ))}
      </ul>

      {missing.length > 0 && (
        <p className="mt-3 text-xs text-[var(--waze-text-muted)]">
          Липсват: {missing.map((s) => s.env_vars.join(", ")).join(" · ")}
        </p>
      )}

      {data.supabase.configured && (
        <p className="mt-2 text-xs text-amber-200/90">
          След ключовете за Supabase приложете SQL от{" "}
          <code className="text-[var(--waze-accent)]">
            supabase/apply_all.sql
          </code>{" "}
          в SQL Editor (веднъж).
        </p>
      )}
    </WazeCard>
  );
}
