"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import {
  WINTER_RULES,
  WINTER_RULES_DISCLAIMER_BG,
} from "@/lib/constants/winter-rules";

export function WinterRulesList() {
  const m = useMessages();
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">{m.route.msgad37c9702a}</h3>
      <ul className="space-y-2">
        {WINTER_RULES.map((rule) => (
          <li
            key={rule.country_code}
            className="rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2 text-sm"
          >
            <p className="font-medium text-[var(--waze-text)]">
              {rule.name_bg}
            </p>
            <p className="text-[var(--waze-text-secondary)]">
              {rule.summary_bg}
            </p>
            <p className="text-xs text-[var(--waze-text-muted)]">
              {rule.period_bg} · {rule.chains_bg}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
        {WINTER_RULES_DISCLAIMER_BG}
      </p>
    </div>
  );
}
