"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { PlanCosts } from "@/lib/costs/estimate";
import { countryName } from "@/lib/geo/country-name";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { MessageCatalog } from "@/lib/i18n/locales/bg";
import type { Locale } from "@/lib/i18n/locale";

/** The wording of one cost line, from its numbers and codes. */
export function costLineText(
  line: PlanCosts["lines"][number],
  m: MessageCatalog,
  locale: Locale
): string {
  const country = line.country ? countryName(line.country, locale) : "";
  const d = line.detail;
  const text = (key: string) => String(d[key] ?? "");
  switch (line.id) {
    case "fuel":
      return d.charge === 1
        ? formatTemplate(m.costs.charge, { kwh: text("kwh"), price: text("eur_per_unit") })
        : formatTemplate(m.costs.fuel, { liters: text("liters"), price: text("eur_per_unit") });
    case "vignette":
      return formatTemplate(m.costs.vignette, {
        country,
        count: text("count"),
        days: text("days"),
        each: text("each_eur"),
      });
    case "tolls":
      return formatTemplate(m.costs.tolls, { country, km: text("km") });
    case "bridge":
      return formatTemplate(m.costs.bridge, { crossings: text("crossings") });
    case "lodging":
      return formatTemplate(m.costs.lodging, {
        nights: text("nights"),
        rooms: text("rooms"),
        price: text("eur_per_room"),
      });
    case "meals":
      return formatTemplate(m.costs.meals, {
        meals: text("meals_each"),
        people: text("people"),
        price: text("eur_per_meal"),
      });
    case "coffee":
      return formatTemplate(m.costs.coffee, { stops: text("stops") });
  }
}

/** The costs as one list with the total, so the driver sees where the money goes. */
export function CostsSection({ costs }: { costs: PlanCosts }) {
  const m = useMessages();
  const locale = useLocale();
  return (
    <section aria-labelledby="plan-costs" className="space-y-2">
      <div>
        <h3 id="plan-costs" className="text-base font-semibold text-[var(--waze-text)]">
          {m.costs.title}
        </h3>
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
          {formatTemplate(m.costs.lead, { date: costs.checked_on })}
        </p>
      </div>
      <ul className="space-y-1.5">
        {costs.lines.map((line, index) => (
          <li
            key={`${line.id}-${line.country ?? index}`}
            className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2 text-sm text-[var(--waze-text)]"
          >
            <span className="min-w-0">{costLineText(line, m, locale)}</span>
            <span className="shrink-0 font-semibold">
              {line.eur == null ? "?" : `≈ ${line.eur} €`}
            </span>
          </li>
        ))}
      </ul>
      <div className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2">
        <p className="text-sm font-semibold text-[var(--waze-text)]">
          {formatTemplate(m.costs.total, {
            total: String(costs.total_eur),
            low: String(costs.total_low),
            high: String(costs.total_high),
          })}
        </p>
        <p className="text-xs text-[var(--waze-text-secondary)]">
          {formatTemplate(m.costs.perPerson, { per: String(costs.per_person_eur) })}
          {costs.incomplete ? ` · ${m.costs.incomplete}` : ""}
        </p>
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
          {costs.round_trip
            ? formatTemplate(m.costs.roundTrip, { days: String(costs.trip_days) })
            : m.costs.oneWay}
        </p>
      </div>
    </section>
  );
}
