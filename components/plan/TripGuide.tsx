"use client";

import { useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { StayOptions } from "@/components/plan/StayOptions";
import { formatWhen } from "@/components/plan/StopTimeline";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { TripGuide as Guide } from "@/lib/ai/trip-guide";
import { guideInputFromPlan } from "@/lib/ai/trip-guide-input";
import { formatTemplate } from "@/lib/i18n/format-template";
import { fuelVerdict } from "@/lib/planner/fuel-verdict";
import type { TripPlannerResult } from "@/lib/planner/types";
import { googleMapsPlaceUrl } from "@/lib/utils/maps-handoff";

type Ai =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; guide: Guide }
  | { status: "unavailable" }
  | { status: "failed" };

/**
 * Practical advice for this group: which planned fuel stops to take or skip,
 * where the fast-food chains are and when the plan passes them, and, from the
 * AI note, where and why to sleep and what to eat. The first two come from the
 * plan's data; the AI text only rephrases facts and is labelled.
 */
export function TripGuide({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const [ai, setAi] = useState<Ai>({ status: "idle" });

  const fuelStops = plan.stops.filter(
    (stop) => !stop.optional && stop.kinds.includes("fuel")
  );
  const foodSpots = plan.food_spots ?? [];
  const countries = [
    ...new Set(
      [...plan.checklist.vignettes, ...plan.checklist.toll_sections]
        .map((item) => item.country_code)
        .filter((code): code is string => Boolean(code))
    ),
  ];

  const ask = async () => {
    setAi({ status: "loading" });
    try {
      const response = await fetch("/api/ai/trip-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guideInputFromPlan(plan, locale, countries)),
      });
      const payload = (await response.json()) as {
        guide: Guide | null;
        available?: boolean;
      };
      if (payload.available === false) setAi({ status: "unavailable" });
      else if (response.ok && payload.guide) {
        setAi({ status: "done", guide: payload.guide });
      } else setAi({ status: "failed" });
    } catch {
      setAi({ status: "failed" });
    }
  };

  const verdictLabel = {
    good: m.guide.verdictGood,
    ok: m.guide.verdictOk,
    avoid: m.guide.verdictAvoid,
  } as const;

  return (
    <section aria-labelledby="plan-guide" className="space-y-4">
      <div>
        <h3
          id="plan-guide"
          className="text-base font-semibold text-[var(--waze-text)]"
        >
          {m.guide.title}
        </h3>
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
          {m.guide.lead}
        </p>
      </div>

      {fuelStops.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--waze-text)]">
            {m.guide.fuelTitle}
          </h4>
          <ul className="mt-2 space-y-2">
            {fuelStops.map((stop) => {
              const result = fuelVerdict(stop);
              return (
                <li
                  key={stop.id}
                  className="rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]"
                >
                  <p className="font-medium">
                    {stop.place_name ?? stop.title}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        result.verdict === "avoid"
                          ? "bg-red-500/15 text-[var(--waze-danger)]"
                          : result.verdict === "good"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : "bg-[var(--waze-surface)] text-[var(--waze-text-secondary)]"
                      }`}
                    >
                      {verdictLabel[result.verdict]}
                    </span>
                  </p>
                  <p className="text-[var(--waze-text-secondary)]">
                    {formatWhen(stop.eta)} · {stop.distance_from_start_km}{" "}
                    {m.units.km}
                    {result.reasons.length > 0
                      ? ` · ${result.reasons.map((reason) => m.guide.reason[reason]).join(", ")}`
                      : ""}
                  </p>
                  {stop.price_label_bg ? (
                    <p className="text-[var(--waze-text-secondary)]">
                      {stop.price_label_bg}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {foodSpots.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--waze-text)]">
            {m.guide.foodTitle}
          </h4>
          <ul className="mt-2 space-y-2">
            {foodSpots.map((spot) => (
              <li
                key={spot.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]"
              >
                <span>
                  <span className="font-medium">{spot.chain}</span>
                  <span className="block text-[var(--waze-text-secondary)]">
                    {formatTemplate(m.guide.foodLine, {
                      time: formatWhen(spot.eta),
                      km: String(spot.distance_from_start_km),
                      detour: spot.detour_km.toFixed(1),
                    })}
                  </span>
                </span>
                <a
                  href={googleMapsPlaceUrl(spot.coords)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plan-no-print inline-flex min-h-11 shrink-0 items-center gap-1 text-[var(--waze-accent-text)] underline"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {m.guide.openMap}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
            {m.guide.foodNote}
          </p>
        </div>
      )}

      {ai.status === "done" ? (
        <AiGuide plan={plan} guide={ai.guide} />
      ) : (
        <div className="plan-no-print">
          <button
            type="button"
            onClick={() => void ask()}
            disabled={ai.status === "loading"}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--waze-border)] px-4 text-sm font-semibold text-[var(--waze-accent-text)] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {ai.status === "loading" ? m.guide.aiLoading : m.guide.aiAsk}
          </button>
          {ai.status === "unavailable" && (
            <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
              {m.ai.unavailable}
            </p>
          )}
          {ai.status === "failed" && (
            <p className="mt-1 text-xs text-[var(--waze-danger)]">
              {m.guide.aiFailed}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function AiGuide({ plan, guide }: { plan: TripPlannerResult; guide: Guide }) {
  const m = useMessages();
  return (
    <div className="space-y-3">
      {guide.overnight.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--waze-text)]">
            {m.guide.overnightTitle}
          </h4>
          {guide.overnight.map((entry) => {
            const stop = plan.stops.find((item) => item.id === entry.stop_id);
            return (
              <div
                key={entry.stop_id}
                className="mt-2 rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]"
              >
                <p className="font-medium">{entry.headline}</p>
                {entry.reasons.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[var(--waze-text-secondary)]">
                    {entry.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
                {entry.check.length > 0 && (
                  <>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
                      {m.guide.check}
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5 text-[var(--waze-text-secondary)]">
                      {entry.check.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
                {stop ? <StayOptions stop={stop} /> : null}
              </div>
            );
          })}
        </div>
      )}
      {guide.meals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--waze-text)]">
            {m.guide.mealsTitle}
          </h4>
          <ul className="mt-2 space-y-2">
            {guide.meals.map((meal) => (
              <li
                key={`${meal.when}-${meal.where}`}
                className="rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]"
              >
                <p className="font-medium">
                  {meal.when} · {meal.where}
                </p>
                <p className="text-[var(--waze-text-secondary)]">{meal.why}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {guide.tips.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--waze-text)]">
            {m.guide.tipsTitle}
          </h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-[var(--waze-text-secondary)]">
            {guide.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-[var(--waze-text-muted)]">{m.ai.disclaimer}</p>
    </div>
  );
}
