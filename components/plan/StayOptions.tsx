"use client";

import { useState } from "react";
import { BedDouble } from "lucide-react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { TripadvisorStay } from "@/lib/api-clients/tripadvisor";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { PlanStop } from "@/lib/planner/types";
import { useRouteStore } from "@/lib/stores/route.store";
import { isoDay } from "@/lib/utils/stay-links";

interface StaysPayload {
  place: string;
  links: { booking: string; airbnb: string; booking_partner: boolean };
  tripadvisor: TripadvisorStay[] | null;
  tripadvisor_configured: boolean;
  why: string | null;
}

/** Where to sleep at an overnight stop: ratings, a short AI note, and booking links. */
export function StayOptions({ stop }: { stop: PlanStop }) {
  const m = useMessages();
  const locale = useLocale();
  const prefs = useRouteStore((state) => state.tripPlan?.preferences);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; data: StaysPayload }
    | { status: "failed" }
  >({ status: "idle" });

  const load = async () => {
    setState({ status: "loading" });
    const children = prefs?.with_children
      ? Math.max(1, prefs.children_ages.length)
      : 0;
    const params = new URLSearchParams({
      lat: String(stop.coords.lat),
      lng: String(stop.coords.lng),
      checkin: isoDay(stop.eta),
      adults: String(prefs?.with_children || (prefs?.drivers ?? 1) > 1 ? 2 : 1),
      children: String(children),
      locale,
      pet: prefs?.with_pet ? "1" : "0",
    });
    try {
      const response = await fetch(`/api/stays?${params}`);
      if (!response.ok) throw new Error("stays");
      setState({ status: "done", data: (await response.json()) as StaysPayload });
    } catch {
      setState({ status: "failed" });
    }
  };

  if (state.status !== "done") {
    return (
      <div className="plan-no-print mt-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={state.status === "loading"}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--waze-border)] px-4 text-sm font-semibold text-[var(--waze-accent-text)] disabled:opacity-50"
        >
          <BedDouble className="h-4 w-4" aria-hidden />
          {state.status === "loading" ? m.stay.loading : m.stay.find}
        </button>
        {state.status === "failed" && (
          <p className="mt-1 text-xs text-[var(--waze-danger)]">{m.stay.failed}</p>
        )}
      </div>
    );
  }

  const { data } = state;
  const link =
    "inline-flex min-h-11 items-center rounded-full bg-[var(--waze-accent)] px-4 text-sm font-semibold text-white";
  return (
    <div className="plan-no-print mt-2 space-y-2">
      <p className="text-sm font-medium text-[var(--waze-text)]">
        {formatTemplate(m.stay.near, { place: data.place })}
      </p>
      {data.tripadvisor && data.tripadvisor.length > 0 && (
        <ul className="space-y-1">
          {data.tripadvisor.map((stay) => (
            <li key={stay.id} className="text-sm text-[var(--waze-text)]">
              <a
                href={stay.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--waze-accent-text)] underline"
              >
                {stay.name}
              </a>
              <span className="text-[var(--waze-text-secondary)]">
                {stay.rating != null ? ` · ${stay.rating.toFixed(1)}★` : ""}
                {stay.reviews != null
                  ? ` · ${formatTemplate(m.stay.reviews, { count: String(stay.reviews) })}`
                  : ""}
                {stay.price_level ? ` · ${stay.price_level}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data.tripadvisor && data.tripadvisor.length > 0 && (
        <p className="text-xs text-[var(--waze-text-muted)]">{m.stay.tripadvisorCredit}</p>
      )}
      {data.why && (
        <>
          <p className="text-sm leading-relaxed text-[var(--waze-text)]">{data.why}</p>
          <p className="text-xs text-[var(--waze-text-muted)]">{m.ai.disclaimer}</p>
        </>
      )}
      {!data.tripadvisor && data.tripadvisor_configured && (
        <p className="text-xs text-[var(--waze-text-muted)]">{m.stay.ratingsUnavailable}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <a
          href={data.links.booking}
          target="_blank"
          rel={`noopener noreferrer${data.links.booking_partner ? " sponsored" : ""}`}
          className={link}
        >
          Booking.com
        </a>
        <a
          href={data.links.airbnb}
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          Airbnb
        </a>
      </div>
      <p className="text-xs text-[var(--waze-text-muted)]">
        {data.links.booking_partner ? m.stay.partnerNote : m.stay.searchNote}
      </p>
    </div>
  );
}
