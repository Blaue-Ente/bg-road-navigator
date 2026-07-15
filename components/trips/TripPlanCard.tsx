"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useUserStore,
  type Profile,
} from "@/lib/stores/user.store";
import type { Route } from "@/types/route.types";
import type { TripPlan, TripPlannerPreferences } from "@/types/trip.types";
import { formatDuration } from "@/lib/utils/route-planner";
import { WazeCard } from "@/components/ui/WazeCard";

interface TripPlanCardProps {
  route: Route;
}

const STOP_ICON = {
  fuel: "⛽",
  ev_charge: "🔌",
  rest: "☕",
  overnight: "🌙",
} as const;

const STOP_LABEL = {
  fuel: "Зареждане",
  ev_charge: "EV заряд",
  rest: "Почивка",
  overnight: "Нощувка",
} as const;

function defaultPreferences(
  profile: Profile | null
): TripPlannerPreferences {
  return {
    vehicle_type: profile?.vehicle_type ?? "car",
    fuel_range_km:
      profile?.vehicle_type === "ev"
        ? undefined
        : profile?.tank_capacity_liters
          ? Math.round(profile.tank_capacity_liters * 12)
          : 550,
    ev_range_km:
      profile?.vehicle_type === "ev" ? profile.ev_range_km ?? 260 : undefined,
  };
}

export function TripPlanCard({ route }: TripPlanCardProps) {
  const profile = useUserStore((state) => state.profile);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trips/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route,
          preferences: defaultPreferences(profile),
        }),
      });

      if (!response.ok) throw new Error("Trip plan failed");
      setPlan((await response.json()) as TripPlan);
    } catch {
      setError("Планът не можа да бъде изчислен. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WazeCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--waze-text)]">
            План за пътуването
          </h2>
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
            Автоматични почивки, зареждане и нощувки според маршрута.
          </p>
        </div>
        <button
          onClick={generatePlan}
          disabled={loading}
          className="waze-btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Изчисляване…" : plan ? "Обнови" : "Създай план"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {plan && (
        <>
          <div className="mt-4 space-y-2">
            {plan.stops.length === 0 ? (
              <p className="text-sm text-[var(--waze-text-muted)]">
                За този маршрут не е нужна планирана спирка.
              </p>
            ) : (
              plan.stops.map((stop) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-3 rounded-xl bg-[var(--waze-surface-elevated)] p-3"
                >
                  <span className="mt-0.5 text-lg" aria-hidden>
                    {STOP_ICON[stop.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium text-[var(--waze-text)]">
                        {stop.title}
                      </p>
                      <span className="text-xs text-[var(--waze-accent)]">
                        {STOP_LABEL[stop.type]} · {stop.distance_from_start_km} км
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--waze-text-secondary)]">
                      Около {formatDuration(stop.estimated_arrival_min)} ·{" "}
                      {stop.description}
                    </p>
                    {stop.requires_confirmation && (
                      <p className="mt-1 text-[11px] text-amber-300">
                        Потвърдете обекта и наличността преди пътуването.
                      </p>
                    )}
                  </div>
                  {stop.type === "overnight" && stop.booking_url && (
                    <a
                      href={stop.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="waze-btn-secondary shrink-0 px-2.5 py-1.5 text-xs"
                    >
                      Търси
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          {plan.warnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              {plan.warnings.map((warning) => (
                <p key={warning} className="text-xs text-amber-200">
                  {warning}
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/fuel" className="waze-btn-secondary px-3 py-2 text-sm">
              Избери гориво / EV
            </Link>
            <Link href="/hotels" className="waze-btn-secondary px-3 py-2 text-sm">
              Виж почивки
            </Link>
          </div>
        </>
      )}
    </WazeCard>
  );
}
