"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import {
  borderWaitClockLines,
  borderWaitView,
} from "@/lib/planner/border-wait-view";
import type { MessageCatalog } from "@/lib/i18n";
import type { BorderChoice, WaitSource } from "@/lib/planner/types";

export function BorderWaitBlock({ chosen }: { chosen: BorderChoice }) {
  const m = useMessages();
  const locale = useLocale();
  const view = borderWaitView(chosen.wait);
  const clock = borderWaitClockLines(chosen.wait, locale, chosen.border_id);
  const displayName = borderDisplayName(locale, {
    crossing_id: chosen.border_id,
    name_bg: chosen.name_bg,
    name_en: chosen.name_en,
  });
  return (
    <div className="mt-2 rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm">
      <p className="font-medium text-[var(--waze-text)]">{displayName}</p>
      <p className="text-[var(--waze-text-secondary)]">{chosen.reason}</p>
      {view.unlicensed ? (
        <p className="mt-1 font-medium text-[var(--waze-text)]">
          {m.sheet.borderUnlicensed}
        </p>
      ) : null}
      {clock.noData ? (
        <p className="mt-1 text-[var(--waze-text)]">
          {m.sheet.borderWait}: {m.prefs.borderNoWaitData}
        </p>
      ) : (
        <div className="mt-1 space-y-0.5 text-[var(--waze-text)]">
          {clock.now ? <p>{clock.now.line}</p> : null}
          {clock.arrival ? <p>{clock.arrival.line}</p> : null}
        </div>
      )}
      {view.trafficDelayMin != null ? (
        <p className="text-[var(--waze-text)]">
          {m.sheet.borderTraffic}: {view.trafficDelayMin} {m.prefs.minutes}
        </p>
      ) : null}
      {view.unlicensed ? null : (
        <>
          <p className="text-[var(--waze-text-secondary)]">
            {m.sheet.borderSource}: {waitSourceLabel(view.source, m)}
            {view.detail ? ` · ${view.detail}` : ""}
          </p>
          {view.ageLabel ? (
            <p className="text-[var(--waze-text-muted)]">
              {m.sheet.borderAge}: {view.ageLabel}
            </p>
          ) : null}
        </>
      )}
      <p className="text-xs text-[var(--waze-text-muted)]">{m.sheet.estimate}</p>
      {view.attribution ? (
        <p className="mt-2 text-[11px] text-[var(--waze-text)]">
          <a
            href={view.attribution.href}
            title="Border queues, forecasts & statistics"
            target="_blank"
            rel="noopener noreferrer"
          >
            {view.attribution.text}
          </a>
        </p>
      ) : null}
    </div>
  );
}

function waitSourceLabel(source: WaitSource, m: MessageCatalog): string {
  return m.waitSource[source] ?? source;
}