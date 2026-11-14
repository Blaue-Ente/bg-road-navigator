"use client";

import { useState } from "react";
import { useRouteStore } from "@/lib/stores/route.store";
import type { TripPlannerResult } from "@/lib/planner/types";
import type { Route } from "@/types/route.types";
import { formatDuration } from "@/lib/utils/route-planner";
import { WazeCard } from "@/components/ui/WazeCard";

const KIND_LABEL: Record<string, string> = {
  fuel: "гориво",
  charge: "зареждане",
  rest: "почивка",
  overnight: "нощувка",
};

export function TripPlanPanel({ route }: { route: Route }) {
  const setTripPlan = useRouteStore((state) => state.setTripPlan);
  const setActiveRoute = useRouteStore((state) => state.setActiveRoute);
  const plan = useRouteStore((state) => state.tripPlan);
  const [level, setLevel] = useState(80);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: {
            label: route.origin.label,
            lng: route.origin.coords.lng,
            lat: route.origin.coords.lat,
          },
          destination: {
            label: route.destination.label,
            lng: route.destination.coords.lng,
            lat: route.destination.coords.lat,
          },
          fuel_level: level / 100,
        }),
      });
      if (!response.ok) throw new Error("plan failed");
      const next = (await response.json()) as TripPlannerResult;
      setTripPlan(next);
      setActiveRoute(routeFromPlan(route, next));
    } catch {
      setError("Планът не можа да бъде изчислен. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WazeCard>
      <h2 className="font-semibold text-[var(--waze-text)]">
        План на пътуването
      </h2>
      <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
        Граница, гориво и почивки по маршрута. Ако сте влезли, се ползва
        запазеният автомобил. Чакането на границата е оценка.
      </p>

      <label className="mt-4 block text-sm text-[var(--waze-text)]">
        Текущо гориво или батерия: {level}%
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={level}
          onChange={(event) => setLevel(Number(event.target.value))}
          className="mt-2 w-full"
        />
      </label>
      <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
        Резерв 15%. Почивка на около 2 ч 15 мин шофиране.
      </p>

      <button
        type="button"
        onClick={build}
        disabled={loading}
        className="waze-btn-primary mt-4 w-full py-3 text-sm disabled:opacity-50"
      >
        {loading ? "Смятаме плана..." : "Направи план"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-[var(--waze-danger)]">{error}</p>
      )}

      {plan && (
        <div className="mt-4 space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-[var(--waze-text)]">
              Граница
            </h3>
            <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
              {plan.border.note}
            </p>
            {plan.border.chosen ? (
              <BorderBlock choice={plan.border.chosen} />
            ) : (
              <p className="mt-2 text-sm text-[var(--waze-text)]">
                Директен маршрут, без граничен избор.
              </p>
            )}
            {plan.border.alternatives.filter((item) => !item.chosen).length >
              0 && (
              <ul className="mt-2 space-y-2">
                {plan.border.alternatives
                  .filter((item) => !item.chosen)
                  .map((item) => (
                    <li key={item.border_id}>
                      <BorderBlock choice={item} />
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[var(--waze-text)]">
              Спирки
            </h3>
            {plan.stops.length === 0 ? (
              <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
                Няма нужда от спирка преди края.
              </p>
            ) : (
              <ol className="mt-2 space-y-3">
                {plan.stops.map((stop, index) => (
                  <li key={stop.id} className="text-sm text-[var(--waze-text)]">
                    <p className="font-medium">
                      {index + 1}. {stop.title}
                    </p>
                    <p className="text-[var(--waze-text-secondary)]">
                      {stop.kinds
                        .map((kind) => KIND_LABEL[kind] ?? kind)
                        .join(" · ")}{" "}
                      · {stop.distance_from_start_km} км ·{" "}
                      {formatDuration(stop.driving_min)} шофиране
                    </p>
                    <p className="text-[var(--waze-text-secondary)]">
                      {stop.reason}
                    </p>
                    {stop.brand && (
                      <p className="text-[var(--waze-text-muted)]">
                        Марка: {stop.brand}
                      </p>
                    )}
                    <p className="text-[var(--waze-text-muted)]">
                      {stop.price
                        ? `${stop.price.amount.toFixed(3)} ${stop.price.currency}/${stop.price.unit === "L" ? "л" : "kWh"} · ${stop.price.source} · ${stop.price.observed_at}`
                        : stop.price_note === "price unknown"
                          ? "Цена: неизвестна"
                          : null}
                    </p>
                    {stop.ratings_available === false && (
                      <p className="text-[var(--waze-text-muted)]">
                        Оценки още не са налични.
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {plan.community.notes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--waze-text)]">
                Сигнали наблизо (+{plan.community.penalty_min} мин)
              </h3>
              <ul className="mt-1 space-y-1 text-sm text-[var(--waze-text-secondary)]">
                {plan.community.notes.map((note) => (
                  <li key={note.id}>
                    {note.title} · {note.age_label}
                    {note.penalty_min > 0 ? ` · +${note.penalty_min} мин` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plan.warnings.length > 0 && (
            <ul className="space-y-1 text-xs text-[var(--waze-warning)]">
              {plan.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </WazeCard>
  );
}

function BorderBlock({
  choice,
}: {
  choice: TripPlannerResult["border"]["alternatives"][number];
}) {
  return (
    <div className="mt-2 rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm">
      <p className="font-medium text-[var(--waze-text)]">
        {choice.chosen ? "Избран пункт: " : ""}
        {choice.name_bg}
      </p>
      <p className="text-[var(--waze-text-secondary)]">{choice.reason}</p>
      <p className="mt-1 text-[var(--waze-text-muted)]">
        Оценка, не официално време. {choice.wait.age_label}.
        {choice.wait.quality === "low" ? " Моделирана оценка." : ""}
      </p>
      {choice.wait.attribution && (
        <p className="mt-1 text-[11px] text-[var(--waze-text)]">
          <a
            href={choice.wait.attribution.href}
            title="Border queues, forecasts & statistics"
            target="_blank"
            rel="noopener"
          >
            {choice.wait.attribution.text}
          </a>
        </p>
      )}
    </div>
  );
}

function routeFromPlan(route: Route, plan: TripPlannerResult): Route {
  const border = plan.route.border_waypoint;
  return {
    ...route,
    distance_km: plan.route.distance_km,
    duration_min: plan.route.duration_min,
    geometry: plan.route.geometry,
    routing_source: plan.route.routing_source,
    waypoints: border
      ? [
          {
            id: plan.border.chosen?.border_id ?? "border",
            label: border.label,
            coords: { lng: border.lng, lat: border.lat },
          },
        ]
      : route.waypoints,
  };
}
