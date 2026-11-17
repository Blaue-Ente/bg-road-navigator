"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { TripNotesInput } from "@/lib/ai/trip-notes";
import type { TripPlannerResult } from "@/lib/planner/types";
import { isHarshWeather } from "@/lib/trip/notices";

export function notesInputFromPlan(
  plan: TripPlannerResult,
  locale: TripNotesInput["locale"]
): TripNotesInput {
  const chosen = plan.border.chosen;
  const prefs = plan.preferences;
  return {
    locale,
    origin: plan.route.origin.label.slice(0, 120),
    destination: plan.route.destination.label.slice(0, 120),
    distance_km: plan.route.distance_km,
    duration_min: plan.route.duration_min,
    border: chosen
      ? {
          name: chosen.name_en.slice(0, 120),
          wait_min: Math.max(0, Math.round(chosen.total_min - chosen.drive_min)),
        }
      : null,
    stops: plan.stops
      .filter((stop) => !stop.optional)
      .slice(0, 20)
      .map((stop) => ({
        title: stop.title.slice(0, 120),
        kinds: stop.kinds.slice(0, 4),
        km: stop.distance_from_start_km,
      })),
    reasons: plan.why_this_route.slice(0, 8).map((reason) => ({
      title: reason.title.slice(0, 160),
      detail: reason.detail.slice(0, 400),
    })),
    weather: plan.weather.segments
      .filter(isHarshWeather)
      .slice(0, 6)
      .map((segment) =>
        `${segment.summary_bg} ${segment.place ?? ""} km ${segment.distance_from_start_km}`
          .trim()
          .slice(0, 160)
      ),
    traveler: [
      prefs.with_children ? "children" : "",
      prefs.with_pet ? "pet" : "",
      prefs.drivers > 1 ? "several drivers" : "",
      prefs.pace === "scenic" ? "scenic pace" : "",
    ].filter(Boolean),
  };
}

/** Optional AI paragraph on why the trip suits this driver. Always labelled. */
export function AiTripNote({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; text: string }
    | { status: "unavailable" }
    | { status: "failed" }
  >({ status: "idle" });

  const ask = async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/ai/trip-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notesInputFromPlan(plan, locale)),
      });
      const payload = (await response.json()) as {
        text: string | null;
        available?: boolean;
      };
      if (payload.available === false) setState({ status: "unavailable" });
      else if (response.ok && payload.text) {
        setState({ status: "done", text: payload.text });
      } else setState({ status: "failed" });
    } catch {
      setState({ status: "failed" });
    }
  };

  return (
    <div className="plan-no-print mt-2">
      {state.status === "done" ? (
        <>
          <p className="text-sm leading-relaxed text-[var(--waze-text)]">{state.text}</p>
          <p className="mt-1 text-xs text-[var(--waze-text-muted)]">{m.ai.disclaimer}</p>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void ask()}
          disabled={state.status === "loading"}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--waze-border)] px-4 text-sm font-semibold text-[var(--waze-accent-text)] disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {state.status === "loading" ? m.ai.loading : m.ai.explain}
        </button>
      )}
      {state.status === "unavailable" && (
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">{m.ai.unavailable}</p>
      )}
      {state.status === "failed" && (
        <p className="mt-1 text-xs text-[var(--waze-danger)]">{m.ai.failed}</p>
      )}
    </div>
  );
}
