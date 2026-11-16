"use client";

import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider";
import {
  WINTER_RULES,
  WINTER_RULES_DISCLAIMER,
  winterRuleChains,
  winterRuleName,
  winterRulePeriod,
  winterRuleSummary,
} from "@/lib/constants/winter-rules";
import { pickText } from "@/lib/i18n/localized-field";

export function WinterRulesList() {
  const m = useMessages();
  const locale = useLocale();
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
              {winterRuleName(locale, rule)}
            </p>
            <p className="text-[var(--waze-text-secondary)]">
              {winterRuleSummary(locale, rule)}
            </p>
            <p className="text-xs text-[var(--waze-text-muted)]">
              {winterRulePeriod(locale, rule)} · {winterRuleChains(locale, rule)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
        {pickText(locale, WINTER_RULES_DISCLAIMER)}
      </p>
    </div>
  );
}
