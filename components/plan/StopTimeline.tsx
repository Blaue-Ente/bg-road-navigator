"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { readApiError } from "@/lib/client/read-api-error";
import { messages as m } from "@/lib/i18n";
import { PLACE_FLAG_VALUES, type PlaceFlagKind } from "@/lib/planner/flag-score";
import type { PlanStop, StopKind } from "@/lib/planner/types";
import { useRouteStore } from "@/lib/stores/route.store";
import { useUserStore } from "@/lib/stores/user.store";
import { formatDuration } from "@/lib/utils/route-planner";

const KIND_COLOR: Record<StopKind, string> = {
  fuel: "#b45309",
  charge: "#047857",
  rest: "#1d4ed8",
  overnight: "#6d28d9",
  sight: "#0f766e",
};

export function StopTimeline({
  stops,
  included,
  onToggle,
  focusedStopId,
}: {
  stops: PlanStop[];
  included: Record<string, boolean>;
  onToggle: (id: string, included: boolean) => void;
  focusedStopId: string | null;
}) {
  const session = useUserStore((state) => state.session);
  const addLocalFlag = useRouteStore((state) => state.addLocalFlag);
  const [flagFor, setFlagFor] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, string>>({});

  return (
    <section aria-labelledby="plan-stops">
      <h3 id="plan-stops" className="text-base font-semibold text-[var(--waze-text)]">
        {m.sheet.stops}
      </h3>
      {stops.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">{m.sheet.stopsEmpty}</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {stops.map((stop, index) => {
            const hotel = stop.kinds.includes("overnight");
            const color = KIND_COLOR[primaryKind(stop)] ?? KIND_COLOR.rest;
            return (
              <li key={stop.id}>
                <article
                  id={`plan-stop-${stop.id}`}
                  tabIndex={-1}
                  aria-current={focusedStopId === stop.id ? "true" : undefined}
                  className={`rounded-2xl border bg-[var(--waze-surface-elevated)] p-3 outline-none ${
                    focusedStopId === stop.id
                      ? "border-[var(--waze-accent)] ring-2 ring-[var(--waze-accent)]"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow"
                      style={{ background: color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--waze-text)]">
                        {index + 1}. {stop.place_name ?? stop.title}
                      </p>
                      <p className="text-sm text-[var(--waze-text-secondary)]">
                        {stop.kinds.map((kind) => m.kinds[kind] ?? kind).join(" · ")}
                        {stop.kinds.length > 1 ? ` · ${m.sheet.combined}` : ""}
                        {stop.optional ? ` · ${m.sheet.optional}` : ""}
                      </p>
                      <p className="text-sm text-[var(--waze-text-secondary)]">
                        {stop.distance_from_start_km} {m.planning.km} ·{" "}
                        {formatDuration(stop.driving_min)} · {formatWhen(stop.eta)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--waze-text)]">{stop.reason}</p>
                      {stop.detour_km != null && (
                        <p className="text-xs text-[var(--waze-text-muted)]">
                          {stop.detour_km} {m.planning.km} {m.sheet.detour}
                          {stop.on_motorway_service ? ` · ${m.sheet.onService}` : ""}
                        </p>
                      )}
                      {stop.brand && (
                        <p className="text-xs text-[var(--waze-text-muted)]">{stop.brand}</p>
                      )}
                      <PriceLine stop={stop} />
                      {stop.advice && (
                        <p className="mt-1 text-sm text-[var(--waze-ok)]">
                          ~{stop.advice.est_savings_eur.toFixed(2)} EUR ·{" "}
                          {stop.advice.cheaper_than_avg_per_l.toFixed(3)} EUR/
                          {m.sheet.perLitre} {m.sheet.adviceSavings} ·{" "}
                          {stop.advice.basis === "official"
                            ? m.sheet.basisOfficial
                            : m.sheet.basisCommunity}
                        </p>
                      )}
                      {hotel && <HotelBlock stop={stop} />}
                      {stop.flags.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1">
                          {stop.flags.map((flag) => (
                            <li
                              key={flag.flag}
                              className="rounded-full bg-[var(--waze-accent-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--waze-accent-text)]"
                            >
                              {flagLabel(flag.flag)}
                            </li>
                          ))}
                        </ul>
                      )}
                      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--waze-text)]">
                        <input
                          type="checkbox"
                          checked={included[stop.id] !== false}
                          onChange={(event) => onToggle(stop.id, event.target.checked)}
                          className="h-4 w-4 accent-[var(--waze-accent)]"
                        />
                        {m.sheet.include}
                      </label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFlagFor((current) => (current === stop.id ? null : stop.id))
                          }
                          disabled={!stop.place_id}
                          className="waze-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          {m.sheet.addFlag}
                        </button>
                        <button
                          type="button"
                          onClick={() => void savePlace(stop)}
                          disabled={savedPlaces[stop.id] === true}
                          className="waze-btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          <Star className="h-3.5 w-3.5" aria-hidden />
                          {savedPlaces[stop.id] ? m.sheet.favoritedPlace : m.sheet.favoritePlace}
                        </button>
                      </div>
                      {!stop.place_id && (
                        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
                          {m.sheet.flagNeedsPlace}
                        </p>
                      )}
                      {flagFor === stop.id && stop.place_id && (
                        <FlagForm
                          onSubmit={(flag) => void submitFlag(stop, flag)}
                        />
                      )}
                      {status[stop.id] && (
                        <p className="mt-2 text-xs text-[var(--waze-text-secondary)]" role="status">
                          {status[stop.id] === m.planning.signInToSave ? (
                            <Link href="/login" className="underline">
                              {status[stop.id]}
                            </Link>
                          ) : (
                            status[stop.id]
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );

  async function submitFlag(stop: PlanStop, flag: string) {
    if (!session) {
      setStatus((current) => ({ ...current, [stop.id]: m.planning.signInToSave }));
      return;
    }
    if (!stop.place_id) return;
    try {
      const response = await fetch("/api/places/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: stop.place_id,
          place_kind: flagKind(stop),
          flag,
        }),
      });
      if (!response.ok) {
        const message = await readApiError(response, m.sheet.flagFailed);
        setStatus((current) => ({ ...current, [stop.id]: message }));
        return;
      }
      addLocalFlag(stop.id, { flag, weight: 1 });
      setFlagFor(null);
      setStatus((current) => ({ ...current, [stop.id]: m.sheet.flagSaved }));
    } catch {
      setStatus((current) => ({ ...current, [stop.id]: m.sheet.flagFailed }));
    }
  }

  async function savePlace(stop: PlanStop) {
    if (!session) {
      setStatus((current) => ({ ...current, [stop.id]: m.planning.signInToSave }));
      return;
    }
    try {
      const response = await fetch("/api/favorites/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: stop.place_id,
          kind: favoriteKind(stop),
          name: stop.place_name ?? stop.title,
          lat: stop.coords.lat,
          lng: stop.coords.lng,
          note: stop.reason,
        }),
      });
      if (!response.ok) {
        const message = await readApiError(response, m.sheet.placeFailed);
        setStatus((current) => ({ ...current, [stop.id]: message }));
        return;
      }
      setSavedPlaces((current) => ({ ...current, [stop.id]: true }));
      setStatus((current) => ({ ...current, [stop.id]: m.sheet.favoritedPlace }));
    } catch {
      setStatus((current) => ({ ...current, [stop.id]: m.sheet.placeFailed }));
    }
  }
}

function HotelBlock({ stop }: { stop: PlanStop }) {
  return (
    <div className="mt-2 rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
        {m.hotel.name}
      </p>
      <p className="font-medium text-[var(--waze-text)]">{stop.place_name ?? stop.title}</p>
      <p className="text-sm text-[var(--waze-text-secondary)]">
        {m.hotel.distance}:{" "}
        {stop.detour_km != null ? `${stop.detour_km} ${m.planning.km}` : "—"}
      </p>
      <p className="text-sm text-[var(--waze-text)]">
        {stop.stars != null
          ? `${m.hotel.stars}: ${"★".repeat(stop.stars)} (${stop.stars})`
          : m.hotel.starsUnknown}
      </p>
      <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
        {m.hotel.reason}: {stop.lodging_note ?? stop.reason}
      </p>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={m.hotel.reserveHint}
        className="waze-btn-secondary mt-3 cursor-not-allowed px-3 py-1.5 text-xs opacity-60"
      >
        {m.hotel.reserve}
      </button>
      <p className="mt-1 text-xs text-[var(--waze-text-muted)]">{m.hotel.reserveHint}</p>
    </div>
  );
}

function PriceLine({ stop }: { stop: PlanStop }) {
  if (stop.price) {
    return (
      <p className="text-xs text-[var(--waze-text-muted)]">
        {stop.price.amount.toFixed(3)} {stop.price.currency}/
        {stop.price.unit === "L" ? m.sheet.perLitre : "kWh"} · {stop.price.source}
      </p>
    );
  }
  if (stop.price_note === "price unknown") {
    return <p className="text-xs text-[var(--waze-text-muted)]">{m.sheet.priceUnknown}</p>;
  }
  return null;
}

function FlagForm({ onSubmit }: { onSubmit: (flag: string) => void }) {
  const [flag, setFlag] = useState<string>(PLACE_FLAG_VALUES[0]);
  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(flag);
      }}
    >
      <label className="text-xs text-[var(--waze-text)]">
        {m.sheet.flagPick}
        <select
          value={flag}
          onChange={(event) => setFlag(event.target.value)}
          className="mt-1 block rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-2 py-1.5 text-sm"
        >
          {PLACE_FLAG_VALUES.map((value) => (
            <option key={value} value={value}>
              {flagLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="waze-btn-secondary px-3 py-1.5 text-xs">
        {m.sheet.addFlag}
      </button>
    </form>
  );
}

function primaryKind(stop: PlanStop): StopKind {
  if (stop.kinds.includes("overnight")) return "overnight";
  if (stop.kinds.includes("charge")) return "charge";
  if (stop.kinds.includes("fuel")) return "fuel";
  if (stop.kinds.includes("sight")) return "sight";
  return "rest";
}

function flagKind(stop: PlanStop): PlaceFlagKind {
  if (stop.kinds.includes("overnight")) return "hotel";
  if (stop.kinds.includes("fuel") || stop.kinds.includes("charge")) return "fuel";
  return "rest";
}

function favoriteKind(
  stop: PlanStop
): "fuel" | "hotel" | "restaurant" | "rest_area" | "custom" {
  if (stop.kinds.includes("overnight")) return "hotel";
  if (stop.kinds.includes("fuel") || stop.kinds.includes("charge")) return "fuel";
  if (stop.kinds.includes("rest")) return "rest_area";
  return "custom";
}

function flagLabel(flag: string): string {
  if (flag in m.flags) return m.flags[flag as keyof typeof m.flags];
  return flag;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
