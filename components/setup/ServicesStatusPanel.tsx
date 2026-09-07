"use client";

import { useServiceStatus } from "@/lib/hooks/useServiceStatus";
import { WazeCard } from "@/components/ui/WazeCard";

const PRIORITY_LABEL = {
  required_for_auth: "Нужен за акаунти",
  recommended: "Препоръчан",
  optional: "По избор",
} as const;

/** Operator-only catalog. Never render this for regular users. */
export function ServicesStatusPanel() {
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
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--waze-text)]">
          Услуги и ключове
        </h2>
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
          {data.summary.configured_count}/{data.summary.total_count} свързани
          {data.supabase.configured ? "" : " · липсва база за акаунти"}
        </p>
      </div>

      <ul className="space-y-2">
        {data.services.map((service) => (
          <li
            key={service.id}
            className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--waze-text)]">
                {service.label}
              </p>
              <p className="text-[11px] text-[var(--waze-text-muted)]">
                {PRIORITY_LABEL[service.priority]} · {service.unlocks}
              </p>
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
          Липсват ключове за: {missing.map((s) => s.label).join(" · ")}
        </p>
      )}

      {data.supabase.configured && (
        <p className="mt-2 text-xs text-amber-200/90">
          След ключовете за Supabase изпълнете еднократно SQL скрипта от
          документацията в SQL Editor.
        </p>
      )}
    </WazeCard>
  );
}
