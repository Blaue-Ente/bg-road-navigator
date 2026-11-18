"use client";

import { useCallback, useState } from "react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { TripGuide } from "@/lib/ai/trip-guide";
import { guideInputFromPlan } from "@/lib/ai/trip-guide-input";
import { costLineText } from "@/components/plan/CostsSection";
import { formatTemplate } from "@/lib/i18n/format-template";
import { unitsFrom } from "@/lib/i18n/units";
import { localeTag } from "@/lib/i18n/locale";
import { makeTripPdf, pdfFilename, savePdfFile } from "@/lib/pdf/make-trip-pdf";
import {
  checklistGroups,
  checklistPlanKey,
  checklistTitle,
  tripPdfInputFromPlan,
  type PlanPdfLabels,
} from "@/lib/pdf/plan-pdf";
import { formatClockDuration } from "@/lib/planner/itinerary";
import type { TripPlannerResult } from "@/lib/planner/types";
import { useTripGuideStore } from "@/lib/stores/trip-guide.store";
import { useUserStore } from "@/lib/stores/user.store";

export type PdfState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "done"; saved: "profile" | "signed-out" | "failed" }
  | { status: "failed" };

/** Asks the server for the AI's written plan. Null when it is off or fails. */
export async function fetchGuide(
  plan: TripPlannerResult,
  locale: Parameters<typeof guideInputFromPlan>[1],
  countries: string[]
): Promise<{ guide: TripGuide | null; available: boolean }> {
  try {
    const response = await fetch("/api/ai/trip-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guideInputFromPlan(plan, locale, countries)),
    });
    const payload = (await response.json()) as {
      guide: TripGuide | null;
      available?: boolean;
    };
    return {
      guide: response.ok ? payload.guide : null,
      available: payload.available !== false,
    };
  } catch {
    return { guide: null, available: true };
  }
}

export function routeCountries(plan: TripPlannerResult): string[] {
  return [
    ...new Set(
      [...plan.checklist.vignettes, ...plan.checklist.toll_sections]
        .map((item) => item.country_code)
        .filter((code): code is string => Boolean(code))
    ),
  ];
}

/**
 * Makes the two-page PDF (the written plan, then the checklist as a table) and
 * keeps the checklist in the signed-in driver's profile. The AI text is asked
 * for first when it has not been yet; without it page one is a plain summary.
 */
export function useTripPdf(plan: TripPlannerResult, checks: Record<string, boolean>) {
  const m = useMessages();
  const locale = useLocale();
  const signedIn = useUserStore((state) => Boolean(state.session?.user));
  const [state, setState] = useState<PdfState>({ status: "idle" });
  const planKey = checklistPlanKey(plan);

  const run = useCallback(async () => {
    setState({ status: "working" });
    try {
      const store = useTripGuideStore.getState();
      let guide: TripGuide | null = store.guides[planKey] ?? null;
      if (!guide) {
        const result = await fetchGuide(plan, locale, routeCountries(plan));
        guide = result.guide;
        if (guide) store.setGuide(planKey, guide);
      }
      const labels: PlanPdfLabels = {
        checklistTitle: m.pdf.checklistTitle,
        checklistHint: m.pdf.checklistHint,
        groupCharges: m.checklist.vignettesAndTolls,
        groupDocuments: m.checklist.documents,
        groupWinter: m.checklist.winter,
        groupKit: m.checklist.kit,
        groupPrep: m.checklist.prep,
        stops: m.itinerary.stops,
        border: m.sheet.border,
        weather: m.sheet.weather,
        sleepWhere: m.pdf.sleepWhere,
        sleepCheck: m.pdf.sleepCheck,
        aiFootnote: m.pdf.aiFootnote,
        plainFootnote: m.pdf.plainFootnote,
        distanceUnit: m.units.km,
        drivingWord: m.pdf.drivingWord,
        arrivalWord: m.pdf.arrivalWord,
      };
      const units = unitsFrom(m);
      const tag = localeTag(locale);
      const bytes = await makeTripPdf(
        tripPdfInputFromPlan({
          plan,
          guide,
          checks,
          labels,
          locale: tag,
          duration: (minutes) => formatClockDuration(minutes, units),
          costs: plan.costs
            ? {
                heading: m.costs.title,
                rows: plan.costs.lines.map((line) => ({
                  label: costLineText(line, m, locale),
                  amount: line.eur == null ? "?" : `\u2248 ${line.eur} \u20ac`,
                })),
                total: `${formatTemplate(m.costs.total, {
                  total: String(plan.costs.total_eur),
                  low: String(plan.costs.total_low),
                  high: String(plan.costs.total_high),
                })} \u00b7 ${formatTemplate(m.costs.perPerson, {
                  per: String(plan.costs.per_person_eur),
                })}`,
                note: formatTemplate(m.costs.lead, { date: plan.costs.checked_on }),
              }
            : undefined,
        })
      );
      savePdfFile(bytes, pdfFilename(plan.route.destination.label, plan.depart_at));

      let saved: "profile" | "signed-out" | "failed" = "signed-out";
      if (signedIn) {
        const response = await fetch("/api/checklists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_key: planKey,
            title: checklistTitle(plan, tag),
            destination: plan.route.destination.label,
            depart_at: plan.depart_at,
            groups: checklistGroups(plan, labels),
            checks,
          }),
        }).catch(() => null);
        saved = response?.ok ? "profile" : "failed";
      }
      setState({ status: "done", saved });
    } catch {
      setState({ status: "failed" });
    }
  }, [plan, planKey, locale, m, checks, signedIn]);

  return { state, run, planKey };
}
