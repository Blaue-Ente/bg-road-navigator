"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { WazeCard } from "@/components/ui/WazeCard";
import { useMessages } from "@/components/i18n/LocaleProvider";
import type { HistoryRow } from "@/lib/db/history";
import { compareSummaries } from "@/lib/history/entry";
import { formatTemplate } from "@/lib/i18n/format-template";
import { unitsFrom } from "@/lib/i18n/units";
import { buildFavoriteEnvelope } from "@/lib/planner/favorite-envelope";
import { formatClockDuration } from "@/lib/planner/itinerary";
import { resolveTripPreferences } from "@/lib/planner/preferences";
import { useRouteStore } from "@/lib/stores/route.store";
import type { RoutePoint } from "@/types/route.types";

function toPoint(id: string, point: { label: string; lng: number; lat: number }): RoutePoint {
  return {
    id: `${id}-${point.lng.toFixed(4)}-${point.lat.toFixed(4)}`,
    label: point.label,
    coords: { lng: point.lng, lat: point.lat },
    source: "geocoder",
  };
}

function signed(value: number | null, unit: string, same: string): string {
  if (value == null) return "–";
  if (value === 0) return same;
  return `${value > 0 ? "+" : "−"}${Math.abs(value)} ${unit}`.trim();
}

/** The driver's last plans, with a way to open one again and to compare two. */
export function RouteHistoryPanel() {
  const m = useMessages();
  const units = unitsFrom(m);
  const router = useRouter();
  const queryClient = useQueryClient();
  const setReplanDraft = useRouteStore((state) => state.setReplanDraft);
  const token = useRef(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [problem, setProblem] = useState<string | null>(null);

  const history = useQuery({
    queryKey: ["route-history"],
    queryFn: async () => {
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("history");
      return (await response.json()) as { items: HistoryRow[]; configured: boolean };
    },
  });
  const items = history.data?.items ?? [];

  const open = (row: HistoryRow) => {
    setReplanDraft({
      token: ++token.current,
      origin: toPoint("origin", row.inputs.origin),
      destination: toPoint("destination", row.inputs.destination),
      via: row.inputs.via.slice(0, 3).map((point) => toPoint("via", point)),
      preferences: resolveTripPreferences(row.inputs.preferences),
      departAt: row.inputs.depart_at,
      fuelLevel: row.inputs.fuel_level,
      favoriteId: null,
      favoriteName: null,
    });
    router.push("/route");
  };

  const favorite = async (row: HistoryRow) => {
    setProblem(null);
    const response = await fetch("/api/favorites/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: row.name,
        origin: row.inputs.origin,
        destination: row.inputs.destination,
        preferences: row.inputs.preferences,
        plan: buildFavoriteEnvelope(
          {
            via: row.inputs.via,
            depart_at: row.inputs.depart_at,
            fuel_level: row.inputs.fuel_level,
          },
          null
        ),
      }),
    }).catch(() => null);
    if (!response?.ok) {
      setProblem(m.history.favoriteFailed);
      return;
    }
    setSaved((current) => new Set(current).add(row.id));
    await queryClient.invalidateQueries({ queryKey: ["favorite-routes"] });
  };

  const remove = async (row: HistoryRow) => {
    setProblem(null);
    const response = await fetch(`/api/history/${row.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setProblem(m.history.removeFailed);
      return;
    }
    setPicked((current) => current.filter((id) => id !== row.id));
    await queryClient.invalidateQueries({ queryKey: ["route-history"] });
  };

  const clear = async () => {
    if (
      items.length === 0 ||
      !window.confirm(formatTemplate(m.history.confirmClear, { count: items.length }))
    ) {
      return;
    }
    setProblem(null);
    const response = await fetch("/api/history", { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setProblem(m.history.removeFailed);
      return;
    }
    setPicked([]);
    await queryClient.invalidateQueries({ queryKey: ["route-history"] });
  };

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].slice(-2)
    );

  const a = items.find((row) => row.id === picked[0]);
  const b = items.find((row) => row.id === picked[1]);
  const diff = a && b ? compareSummaries(a.summary, b.summary) : null;
  const when = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso)
    );

  return (
    <WazeCard>
      <h2 className="text-base font-semibold text-[var(--waze-accent-text)]">{m.history.title}</h2>
      <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">{m.history.intro}</p>
      {problem ? (
        <p className="mt-3 text-sm text-[var(--waze-danger)]" role="alert">
          {problem}
        </p>
      ) : null}
      {history.isLoading ? null : history.isError ? (
        <p className="mt-3 text-sm text-[var(--waze-danger)]">{m.history.failed}</p>
      ) : history.data?.configured === false ? (
        <p className="mt-3 text-sm text-[var(--waze-text-muted)]">{m.history.unavailable}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--waze-text-muted)]">{m.history.empty}</p>
      ) : (
        <>
          <p className="mt-3 text-xs text-[var(--waze-text-muted)]">{m.history.compareHint}</p>
          <ul className="mt-2 space-y-3">
            {items.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-3"
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={picked.includes(row.id)}
                    onChange={() => toggle(row.id)}
                    className="mt-1 h-5 w-5 shrink-0"
                    aria-label={`${m.history.compare}: ${row.name}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--waze-text)]">{row.name}</span>
                    <span className="block text-xs text-[var(--waze-text-muted)]">
                      {formatTemplate(m.history.departs, { date: when(row.summary.depart_at) })}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--waze-text)]">
                      {formatTemplate(m.history.line, {
                        km: String(row.summary.distance_km),
                        drive: formatClockDuration(row.summary.duration_min, units),
                        nights: String(row.summary.nights),
                        stops: String(row.summary.stops),
                      })}
                    </span>
                    {row.summary.cost_total_eur != null ? (
                      <span className="block text-xs text-[var(--waze-text-secondary)]">
                        {formatTemplate(m.history.cost, {
                          eur: String(Math.round(row.summary.cost_total_eur)),
                          person: String(Math.round(row.summary.cost_per_person_eur ?? 0)),
                        })}
                      </span>
                    ) : null}
                  </span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => open(row)}
                    className="waze-btn-primary min-h-11 px-4 text-sm font-semibold"
                  >
                    {m.history.open}
                  </button>
                  <button
                    type="button"
                    onClick={() => void favorite(row)}
                    disabled={saved.has(row.id)}
                    className="waze-btn-secondary min-h-11 px-4 text-sm disabled:opacity-60"
                  >
                    {saved.has(row.id) ? m.history.favorited : m.history.favorite}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    className="min-h-11 px-3 text-sm text-[var(--waze-danger)]"
                  >
                    {m.history.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {diff && a && b ? (
            <div className="mt-4 rounded-xl border border-[var(--waze-border)] p-3">
              <h3 className="text-sm font-semibold text-[var(--waze-text)]">{m.history.compareTitle}</h3>
              <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
                {a.name} → {b.name}
              </p>
              <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm text-[var(--waze-text)]">
                <dt>{m.history.col.distance}</dt>
                <dd>{signed(diff.distance_km, m.units.km, m.history.same)}</dd>
                <dt>{m.history.col.driving}</dt>
                <dd>{signed(diff.duration_min, m.prefs.minutes, m.history.same)}</dd>
                <dt>{m.history.col.total}</dt>
                <dd>{signed(diff.total_min, m.prefs.minutes, m.history.same)}</dd>
                <dt>{m.history.col.nights}</dt>
                <dd>{signed(diff.nights, "", m.history.same)}</dd>
                <dt>{m.history.col.stops}</dt>
                <dd>{signed(diff.stops, "", m.history.same)}</dd>
                <dt>{m.history.col.cost}</dt>
                <dd>{signed(diff.cost_total_eur, "€", m.history.same)}</dd>
                <dt>{m.history.col.person}</dt>
                <dd>{signed(diff.cost_per_person_eur, "€", m.history.same)}</dd>
              </dl>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void clear()}
            className="mt-4 min-h-11 text-sm text-[var(--waze-danger)]"
          >
            {m.history.clear}
          </button>
        </>
      )}
    </WazeCard>
  );
}
