import { messages as m } from "@/lib/i18n";
import { borderWaitView } from "@/lib/planner/border-wait-view";
import { formatZonedHourLabel } from "@/lib/planner/wait";
import type { BorderChoice, WaitSource } from "@/lib/planner/types";

export function BorderWaitBlock({
  chosen,
  arrivalAt,
}: {
  chosen: BorderChoice;
  arrivalAt?: Date | string | null;
}) {
  const view = borderWaitView(chosen.wait);
  return (
    <div className="mt-2 rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm">
      <p className="font-medium text-[var(--waze-text)]">{chosen.name_bg}</p>
      <p className="text-[var(--waze-text-secondary)]">{chosen.reason}</p>
      {view.unlicensed ? (
        <p className="mt-1 font-medium text-[var(--waze-text)]">{m.sheet.borderUnlicensed}</p>
      ) : null}
      <p className="mt-1 text-[var(--waze-text)]">
        {m.sheet.borderWait}
        {arrivalAt
          ? ` при пристигане · ${formatZonedHourLabel(new Date(arrivalAt))}`
          : ""}
        : {view.minutes} {m.prefs.minutes}
      </p>
      {view.trafficDelayMin != null ? (
        <p className="text-[var(--waze-text)]">
          {m.sheet.borderTraffic}: {view.trafficDelayMin} {m.prefs.minutes}
        </p>
      ) : null}
      {view.unlicensed ? null : (
        <>
          <p className="text-[var(--waze-text-secondary)]">
            {m.sheet.borderSource}: {waitSource(view.source)}
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

function waitSource(source: WaitSource): string {
  return m.waitSource[source] ?? source;
}
