"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileDown, RefreshCw } from "lucide-react";
import { StayOptions } from "@/components/plan/StayOptions";
import {
  chosenSightsFor,
  fetchGuide,
  guideKeyFor,
  routeCountries,
  useTripPdf,
} from "@/components/plan/useTripPdf";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { TripLoadingIcons } from "@/components/ui/TripLoadingIcons";
import { WazeCard } from "@/components/ui/WazeCard";
import type { TripGuide as Guide } from "@/lib/ai/trip-guide";
import { checklistPlanKey } from "@/lib/pdf/plan-pdf";
import { checklistStorageKey } from "@/lib/planner/itinerary";
import type { TripPlannerResult } from "@/lib/planner/types";
import { useRouteStore } from "@/lib/stores/route.store";
import { useTripGuideStore } from "@/lib/stores/trip-guide.store";

type Ai = "idle" | "loading" | "unavailable" | "failed";

function readChecks(key: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const checks: Record<string, boolean> = {};
    for (const [id, value] of Object.entries(parsed)) if (value === true) checks[id] = true;
    return checks;
  } catch {
    return {};
  }
}

/** The AI plan on its own page: the written plan, then where to sleep with links. */
export function AiPlanView() {
  const m = useMessages();
  const plan = useRouteStore((state) => state.tripPlan);
  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader title={m.aiPlan.title} />
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--waze-accent-text)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {m.aiPlan.back}
        </Link>
        {plan ? (
          <Body plan={plan} />
        ) : (
          <WazeCard>
            <p className="text-sm text-[var(--waze-text-secondary)]">{m.aiPlan.noPlan}</p>
          </WazeCard>
        )}
      </div>
    </div>
  );
}

function Body({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const [ai, setAi] = useState<Ai>("idle");
  const planKey = checklistPlanKey(plan);
  const sightsState = useRouteStore((state) => state.sights);
  const chosen = useMemo(
    () => chosenSightsFor(plan),
    // The chosen places live in the store; plan and list decide what is chosen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, sightsState]
  );
  const guideKey = guideKeyFor(planKey, chosen);
  const guide = useTripGuideStore((state) => state.guides[guideKey] ?? null);
  const setGuide = useTripGuideStore((state) => state.setGuide);
  const checks = useMemo(() => readChecks(checklistStorageKey(plan)), [plan]);
  const pdf = useTripPdf(plan, checks);
  const asked = useRef<string | null>(null);

  const ask = async () => {
    setAi("loading");
    const result = await fetchGuide(
      plan,
      locale,
      routeCountries(plan),
      useRouteStore.getState().planningVia.map((point) => point.label),
      chosen
    );
    if (result.guide) {
      setGuide(guideKey, result.guide);
      setAi("idle");
    } else if (!result.available) setAi("unavailable");
    else setAi("failed");
  };

  // Opening the page is the request: write the plan once per plan, unless it is already kept.
  useEffect(() => {
    if (guide || asked.current === guideKey) return;
    asked.current = guideKey;
    void ask();
    // `ask` reads the current plan; the key says when it is a new one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideKey]);

  const nights = plan.stops.filter((stop) => !stop.optional && stop.kinds.includes("overnight"));

  return (
    <>
      <WazeCard>
        {guide ? <AiText guide={guide} /> : null}
        {ai === "loading" && (
          <p className="flex items-center gap-3 text-sm text-[var(--waze-text-secondary)]" role="status">
            <TripLoadingIcons />
            {m.aiPlan.working}
          </p>
        )}
        {ai === "unavailable" && (
          <p className="text-sm text-[var(--waze-text-muted)]">{m.ai.unavailable}</p>
        )}
        {ai === "failed" && (
          <p className="text-sm text-[var(--waze-danger)]">{m.guide.aiFailed}</p>
        )}
        <div className="plan-no-print mt-3 flex flex-wrap gap-2">
          {(ai === "failed" || ai === "unavailable" || guide) && (
            <button
              type="button"
              onClick={() => void ask()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--waze-border)] px-4 text-sm font-semibold text-[var(--waze-accent-text)]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {m.aiPlan.retry}
            </button>
          )}
          <button
            type="button"
            onClick={() => void pdf.run()}
            disabled={pdf.state.status === "working"}
            className="waze-btn-primary inline-flex min-h-11 items-center gap-2 px-4 text-sm disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" aria-hidden />
            {pdf.state.status === "working" ? m.pdf.preparing : m.pdf.download}
          </button>
        </div>
        {pdf.state.status === "failed" && (
          <p className="mt-1 text-xs text-[var(--waze-danger)]">{m.pdf.failed}</p>
        )}
      </WazeCard>

      <WazeCard>
        <h2 className="text-base font-semibold text-[var(--waze-text)]">{m.aiPlan.hotels}</h2>
        {nights.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">{m.aiPlan.hotelsNone}</p>
        ) : (
          nights.map((stop) => {
            const entry = guide?.overnight.find((item) => item.stop_id === stop.id);
            return (
              <div key={stop.id} className="mt-3 rounded-xl bg-[var(--waze-surface-elevated)] p-3">
                <p className="text-sm font-medium text-[var(--waze-text)]">
                  {entry?.where ?? stop.hotel?.name ?? stop.place_name ?? stop.title}
                </p>
                {entry?.why ? (
                  <p className="mt-0.5 text-sm text-[var(--waze-text-secondary)]">{entry.why}</p>
                ) : null}
                {entry && entry.check.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-[var(--waze-text-secondary)]">
                    {entry.check.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                <StayOptions stop={stop} autoLoad />
              </div>
            );
          })
        )}
      </WazeCard>
    </>
  );
}

function AiText({ guide }: { guide: Guide }) {
  const m = useMessages();
  return (
    <div className="space-y-3">
      {guide.title ? (
        <h2 className="text-base font-semibold text-[var(--waze-text)]">{guide.title}</h2>
      ) : null}
      {guide.intro ? (
        <p className="text-sm leading-relaxed text-[var(--waze-text)]">{guide.intro}</p>
      ) : null}
      {guide.sections.map((section) => (
        <div key={section.heading}>
          <h3 className="text-sm font-semibold text-[var(--waze-accent-text)]">{section.heading}</h3>
          <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-[var(--waze-text)]">
            {section.text}
          </p>
        </div>
      ))}
      {guide.closing ? (
        <p className="text-sm font-medium text-[var(--waze-text)]">{guide.closing}</p>
      ) : null}
      <p className="text-xs text-[var(--waze-text-muted)]">{m.ai.disclaimer}</p>
    </div>
  );
}
