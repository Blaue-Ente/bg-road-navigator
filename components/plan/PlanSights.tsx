"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { TripLoadingIcons } from "@/components/ui/TripLoadingIcons";
import { NavigateButtons } from "@/components/ui/NavigateButtons";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { TripPlannerResult } from "@/lib/planner/types";
import { chosenExtraMin, sightsInputFromPlan, sightsKey } from "@/lib/sights/input";
import type { PlanSight } from "@/lib/sights/types";
import { useRouteStore } from "@/lib/stores/route.store";

type Status = "idle" | "loading" | "failed" | "unavailable";

function clock(iso: string, extraMin: number): string {
  const date = new Date(new Date(iso).getTime() + extraMin * 60_000);
  return new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/**
 * Places worth a stop, for a road the driver chose as "interesting". They are
 * looked up only when the driver asks, and each one can be added to the trip or
 * taken out again.
 */
export function PlanSights({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const sights = useRouteStore((state) => state.sights);
  const setSights = useRouteStore((state) => state.setSights);
  const toggleSight = useRouteStore((state) => state.toggleSight);
  const via = useRouteStore((state) => state.planningVia.map((point) => point.label));
  const [status, setStatus] = useState<Status>("idle");

  if (plan.preferences.pace !== "scenic") return null;
  const key = sightsKey(plan, via);
  const current = sights && sights.key === key ? sights : null;

  const load = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/ai/sights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sightsInputFromPlan(plan, locale, via)),
      });
      const payload = (await response.json()) as {
        sights?: PlanSight[];
        available?: boolean;
      };
      if (payload.available === false) {
        setStatus("unavailable");
        return;
      }
      if (!response.ok) {
        setStatus("failed");
        return;
      }
      setSights({ key, items: payload.sights ?? [], chosen: [] });
      setStatus("idle");
    } catch {
      setStatus("failed");
    }
  };

  const arrivalIso =
    plan.route.arrive_at ??
    new Date(Date.parse(plan.depart_at) + plan.route.total_min * 60_000).toISOString();
  const extra = current ? chosenExtraMin(current.items, current.chosen) : 0;

  return (
    <section aria-labelledby="plan-sights" className="space-y-3">
      <div>
        <h3 id="plan-sights" className="text-base font-semibold text-[var(--waze-text)]">
          {m.sights.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">{m.sights.intro}</p>
      </div>

      {plan.route.scenic ? (
        <p className="rounded-xl bg-[var(--waze-accent-muted)] px-3 py-2 text-sm text-[var(--waze-accent-text)]">
          {formatTemplate(
            {
              applied: m.sights.roadApplied,
              too_long: m.sights.roadTooLong,
              long_trip: m.sights.roadLongTrip,
              same: m.sights.roadSame,
              unsupported: m.sights.roadUnsupported,
            }[plan.route.scenic.reason],
            {
              km: String(Math.round(plan.route.scenic.extra_km ?? 0)),
              min: String(Math.round(plan.route.scenic.extra_min ?? 0)),
            }
          )}
        </p>
      ) : null}

      {!current ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={status === "loading"}
            className="waze-btn-primary inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold disabled:opacity-60"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {status === "loading" ? m.sights.loading : m.sights.show}
          </button>
          {status === "loading" ? (
            <p className="flex items-center gap-3 text-sm text-[var(--waze-text-secondary)]" role="status">
              <TripLoadingIcons />
              {m.sights.loading}
            </p>
          ) : null}
          {status === "failed" ? (
            <p className="text-sm text-[var(--waze-danger)]">{m.sights.failed}</p>
          ) : null}
          {status === "unavailable" ? (
            <p className="text-sm text-[var(--waze-text-muted)]">{m.sights.unavailable}</p>
          ) : null}
        </div>
      ) : current.items.length === 0 ? (
        <p className="text-sm text-[var(--waze-text-muted)]">{m.sights.none}</p>
      ) : (
        <>
          <ul className="space-y-3">
            {current.items.map((item) => {
              const chosen = current.chosen.includes(item.id);
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-3"
                >
                  <p className="text-sm font-semibold text-[var(--waze-text)]">
                    {item.name}
                    <span className="font-normal text-[var(--waze-text-secondary)]">
                      {" "}
                      · {item.town}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--waze-text-muted)]">
                    {m.sights.kind[item.kind]} ·{" "}
                    {formatTemplate(m.sights.extra, { min: String(item.extra_min) })}
                  </p>
                  {item.why ? (
                    <p className="mt-2 text-sm text-[var(--waze-text)]">{item.why}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
                    {formatTemplate(m.sights.offRoad, {
                      km: String(item.off_route_km),
                      at: String(item.along_km),
                    })}
                    {item.near_rest_km != null
                      ? ` ${formatTemplate(m.sights.replacesRest, { km: String(item.near_rest_km) })}`
                      : ""}
                    {item.family_friendly ? ` ${m.sights.family}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSight(item.id)}
                      aria-pressed={chosen}
                      className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                        chosen
                          ? "bg-[var(--waze-surface)] text-[var(--waze-text)] ring-1 ring-[var(--waze-border)]"
                          : "bg-[var(--waze-accent)] text-white"
                      }`}
                    >
                      {chosen ? `${m.sights.added} · ${m.sights.remove}` : m.sights.add}
                    </button>
                    <NavigateButtons
                      point={{ lng: item.lng, lat: item.lat }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {current.chosen.length > 0 ? (
            <p className="text-sm font-medium text-[var(--waze-text)]">
              {formatTemplate(m.sights.total, {
                count: String(current.chosen.length),
                min: String(extra),
                time: clock(arrivalIso, extra),
              })}
            </p>
          ) : null}
          <p className="text-xs text-[var(--waze-text-muted)]">{m.sights.note}</p>
        </>
      )}
    </section>
  );
}
