"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";

import type {
  ChecklistItem,
  PlanChecklist as Checklist,
} from "@/lib/planner/types";
import { roadSafetyCopy } from "@/lib/i18n/road-safety";
import { catalog } from "@/lib/i18n/locale";
export function PlanChecklist({
  checklist,
  warnings,
  checks,
  onToggle,
}: {
  checklist: Checklist;
  warnings: string[];
  checks: Record<string, boolean>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const m = useMessages();
  const routeCharges: ChecklistItem[] = [
    ...checklist.vignettes,
    ...checklist.toll_sections,
  ];
  const groups: Array<{ id: string; title: string; items: ChecklistItem[] }> = [
    {
      id: "route-charges",
      title: m.checklist.vignettesAndTolls,
      items: routeCharges,
    },
    {
      id: "documents",
      title: m.checklist.documents,
      items: checklist.documents,
    },
    { id: "winter", title: m.checklist.winter, items: checklist.winter },
    { id: "kit", title: m.checklist.kit, items: checklist.kit },
  ];

  return (
    <section aria-labelledby="plan-checklist" className="space-y-4">
      <div>
        <h3
          id="plan-checklist"
          className="text-base font-semibold text-[var(--waze-text)]"
        >
          {m.checklist.title}
        </h3>
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
          {m.checklist.hint}
        </p>
      </div>
      {groups.map((group) => (
        <div key={group.id}>
          <h4 className="text-sm font-semibold text-[var(--waze-text)]">
            {group.title}
          </h4>
          {group.items.length === 0 ? (
            <p className="mt-1 text-sm text-[var(--waze-text-muted)]">
              {m.checklist.empty}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl bg-[var(--waze-surface-elevated)] p-3"
                >
                  <label className="flex items-start gap-3 text-sm text-[var(--waze-text)]">
                    <input
                      type="checkbox"
                      checked={checks[item.id] === true}
                      onChange={(event) =>
                        onToggle(item.id, event.target.checked)
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--waze-accent)]"
                    />
                    <span>
                      <span className="font-medium">{item.title}</span>
                      {item.charge_kind && (
                        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
                          {item.charge_kind === "distance_toll"
                            ? m.planner.checklist.distanceToll
                            : m.planner.checklist.vignette}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[var(--waze-text-secondary)]">
                        {item.detail}
                      </span>
                    </span>
                  </label>
                  {item.href && (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block pl-7 text-sm text-[var(--waze-accent-text)] underline"
                    >
                      {checklistOfficialLinkLabel(item)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <PlanSafetyBlock checklist={checklist} checks={checks} onToggle={onToggle} />
      {warnings.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--waze-warning)]">
            {m.checklist.warnings}
          </h4>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning) => (
              <li key={warning} className="text-sm text-[var(--waze-warning)]">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function PlanSafetyBlock({
  checklist,
  checks,
  onToggle,
}: {
  checklist: Checklist;
  checks: Record<string, boolean>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const locale = useLocale();
  const safetyUi = roadSafetyCopy(locale);
  const safety = checklist.safety ?? [];
  const links = checklist.bg_links ?? [];
  if (safety.length === 0 && links.length === 0) return null;
  const law = safety.filter((item) => item.kind === "law");
  const advice = safety.filter((item) => item.kind === "advice");
  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--waze-text)]">
        {safetyUi.title}
      </h4>
      <SafetyGroup
        label={safetyUi.law_label}
        items={law}
        checks={checks}
        onToggle={onToggle}
      />
      <SafetyGroup
        label={safetyUi.advice_label}
        items={advice}
        checks={checks}
        onToggle={onToggle}
      />
      {checklist.safety_closing && (
        <p className="mt-3 text-sm font-medium text-[var(--waze-text)]">
          {checklist.safety_closing}
        </p>
      )}
      {links.length > 0 && (
        <ul className="mt-3 space-y-2">
          {links.map((item) => (
            <li
              key={item.id}
              className="rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm"
            >
              <p className="font-medium text-[var(--waze-text)]">
                {item.title}
              </p>
              <p className="mt-0.5 text-[var(--waze-text-secondary)]">
                {item.detail}
              </p>
              {item.href && (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-[var(--waze-accent-text)] underline"
                >
                  {checklistOfficialLinkLabel(item)}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function checklistOfficialLinkLabel(item: ChecklistItem): string {
  const labels = catalog("bg").planner.checklist;
  if (item.link_label) return item.link_label;
  if (item.link_role === "info") return labels.officialInfo;
  if (item.link_role === "shop") return labels.officialShop;
  return labels.officialShop;
}

function SafetyGroup({
  label,
  items,
  checks,
  onToggle,
}: {
  label: string;
  items: Checklist["safety"];
  checks: Record<string, boolean>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <h5 className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
        {label}
      </h5>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl bg-[var(--waze-surface-elevated)] p-3"
          >
            <label className="flex items-start gap-3 text-sm text-[var(--waze-text)]">
              <input
                type="checkbox"
                checked={checks[item.id] === true}
                onChange={(event) => onToggle(item.id, event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--waze-accent)]"
              />
              <span>
                <span className="font-medium">{item.title}</span>
                <span className="mt-0.5 block text-[var(--waze-text-secondary)]">
                  {item.detail}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
