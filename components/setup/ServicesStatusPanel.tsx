"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { formatTemplate } from "@/lib/i18n/format-template";
import { useServiceStatus } from "@/lib/hooks/useServiceStatus";
import { WazeCard } from "@/components/ui/WazeCard";

/** Operator-only catalog. Never render this for regular users. */
export function ServicesStatusPanel() {
  const m = useMessages();
  const priorityLabel = {
    required_for_auth: m.setup.msg17a2874498,
    recommended: m.setup.msg1bdf450223,
    optional: m.sheet.optional,
  } as const;
  const { data, isLoading, isError, refetch } = useServiceStatus();

  if (isLoading) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-muted)]">{m.setup.msgeaa64818de}</p>
      </WazeCard>
    );
  }

  if (isError || !data) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-secondary)]">{m.setup.msgbac040a5ba}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm text-[var(--waze-accent-text)] underline"
        >{m.communityPage.msg87b6d05132}</button>
      </WazeCard>
    );
  }

  const missing = data.services.filter((s) => !s.configured);

  return (
    <WazeCard>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--waze-text)]">{m.setup.msg53be117927}</h2>
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
          {formatTemplate(m.setup.servicesConnected, {
            configured: data.summary.configured_count,
            total: data.summary.total_count,
          })}
          {data.database.configured ? "" : m.setup.msgd4af0d86e3}
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
                {priorityLabel[service.priority]} · {service.unlocks_bg}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                service.configured
                  ? "bg-emerald-500/15 text-[var(--waze-ok)]"
                  : "bg-amber-500/15 text-[var(--waze-warning)]"
              }`}
            >
              {service.configured ? "OK" : m.setup.msg148160a258}
            </span>
          </li>
        ))}
      </ul>

      {missing.length > 0 && (
        <p className="mt-3 text-xs text-[var(--waze-text-muted)]">
          {m.setup.missingKeysFor}{" "}
          {missing.map((s) => s.label).join(" · ")}
        </p>
      )}

      {!data.database.configured && (
        <p className="mt-2 text-xs text-[var(--waze-warning)]">
          {formatTemplate(m.setup.accountDatabaseHint, {
            migration: data.database.migration,
          })}
        </p>
      )}
    </WazeCard>
  );
}
