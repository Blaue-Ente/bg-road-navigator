"use client";

import Link from "next/link";
import { useRouteStore } from "@/lib/stores/route.store";
import { FileDown, MapPin, Sparkles } from "lucide-react";
import { useTripPdf } from "@/components/plan/useTripPdf";
import { formatWhen } from "@/components/plan/StopTimeline";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { formatTemplate } from "@/lib/i18n/format-template";
import { isPeakChargingTime } from "@/lib/planner/ev-peak";
import { fuelVerdict } from "@/lib/planner/fuel-verdict";
import type { TripPlannerResult } from "@/lib/planner/types";
import { googleMapsPlaceUrl } from "@/lib/utils/maps-handoff";

/**
 * Practical advice for this group: which planned fuel stops to take or skip,
 * where the fast-food chains are and when the plan passes them, and, from the
 * AI note, where and why to sleep and what to eat. The first two come from the
 * plan's data; the AI text only rephrases facts and is labelled.
 */
export function TripGuide({
  plan,
  checks,
}: {
  plan: TripPlannerResult;
  checks: Record<string, boolean>;
}) {
  const m = useMessages();
  const pdf = useTripPdf(plan, checks);

  const fuelStops = plan.stops.filter(
    (stop) => !stop.optional && stop.kinds.includes("fuel")
  );
  const chargeStops = plan.stops.filter(
    (stop) => !stop.optional && stop.kinds.includes("charge")
  );
  const foodSpots = plan.food_spots ?? [];
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

      {chargeStops.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--waze-text)]">
            {m.guide.evTitle}
          </h4>
          <ul className="mt-2 space-y-2">
            {chargeStops.map((stop) => {
              const peak = isPeakChargingTime(stop.eta, stop.time_zone);
              return (
                <li
                  key={stop.id}
                  className="rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]"
                >
                  <p className="font-medium">
                    {stop.place_name ?? stop.title}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        peak
                          ? "bg-amber-500/20 text-[var(--waze-warning)]"
                          : "bg-emerald-500/15 text-emerald-700"
                      }`}
                    >
                      {peak ? m.guide.evPeakBadge : m.guide.evCalmBadge}
                    </span>
                  </p>
                  <p className="text-[var(--waze-text-secondary)]">
                    {formatWhen(stop.eta)} · {stop.distance_from_start_km}{" "}
                    {m.units.km}
                  </p>
                  <p className="mt-1 text-[var(--waze-text-secondary)]">
                    {peak ? m.guide.evPeak : m.guide.evCalm}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
            {m.guide.evNote}
          </p>
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

      <div className="plan-no-print space-y-2">
        <Link
          href="/plan/ai"
          onClick={() => useRouteStore.getState().setPlanMinimized(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--waze-border)] px-4 text-sm font-semibold text-[var(--waze-accent-text)]"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {m.aiPlan.button}
        </Link>
        <p className="text-xs text-[var(--waze-text-muted)]">{m.aiPlan.buttonHint}</p>
        <button
          type="button"
          onClick={() => void pdf.run()}
          disabled={pdf.state.status === "working"}
          className="waze-btn-primary inline-flex min-h-11 items-center gap-2 px-4 text-sm disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" aria-hidden />
          {pdf.state.status === "working" ? m.pdf.preparing : m.pdf.download}
        </button>
        {pdf.state.status === "failed" && (
          <p className="text-xs text-[var(--waze-danger)]">{m.pdf.failed}</p>
        )}
        {pdf.state.status === "done" && (
          <p className="text-xs text-[var(--waze-text-secondary)]">
            {pdf.state.saved === "profile"
              ? m.pdf.savedToProfile
              : pdf.state.saved === "failed"
                ? m.pdf.notSaved
                : m.pdf.notSavedSignedOut}
          </p>
        )}
      </div>
    </section>
  );
}
