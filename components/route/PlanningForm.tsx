"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { LocationSearchInput } from "@/components/route/LocationSearchInput";
import { PreferenceFields } from "@/components/route/PreferenceFields";
import { WazeCard } from "@/components/ui/WazeCard";
import { readApiError } from "@/lib/client/read-api-error";
import { buildFavoriteEnvelope } from "@/lib/planner/favorite-envelope";
import {
  fromDatetimeLocalValue,
  normalizePlannerPreferences,
  toDatetimeLocalValue,
} from "@/lib/planner/form-preferences";
import {
  resolveTripPreferences,
  type TripPreferences,
} from "@/lib/planner/preferences";
import { useRouteStore } from "@/lib/stores/route.store";
import { useUserStore, type Profile } from "@/lib/stores/user.store";
import { messages as m } from "@/lib/i18n";
import type { RoutePoint } from "@/types/route.types";

export interface PlanningSubmit {
  preferences: TripPreferences;
  departAt: string | null;
  fuelLevel: number;
}

export function PlanningForm({
  origin,
  destination,
  via,
  onOrigin,
  onDestination,
  onVia,
  calculating,
  error,
  onSubmit,
}: {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  via: RoutePoint | null;
  onOrigin: (place: RoutePoint) => void;
  onDestination: (place: RoutePoint) => void;
  onVia: (place: RoutePoint | null) => void;
  calculating: boolean;
  error: string | null;
  onSubmit: (draft: PlanningSubmit) => void;
}) {
  const profile = useUserStore((state) => state.profile);
  const session = useUserStore((state) => state.session);
  const setProfile = useUserStore((state) => state.setProfile);
  const tripPlan = useRouteStore((state) => state.tripPlan);
  const replan = useRouteStore((state) => state.replanDraft);
  const setReplanDraft = useRouteStore((state) => state.setReplanDraft);
  const [prefs, setPrefs] = useState<TripPreferences>(() =>
    resolveTripPreferences(undefined, profile?.trip_preferences)
  );
  const [depart, setDepart] = useState(() =>
    toDatetimeLocalValue(profile?.trip_preferences?.depart_at)
  );
  const [fuel, setFuel] = useState(80);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"settings" | "star" | null>(null);
  const edited = useRef(false);
  const appliedReplan = useRef(0);

  useEffect(() => {
    if (edited.current || !profile?.trip_preferences) return;
    setPrefs(resolveTripPreferences(undefined, profile.trip_preferences));
    setDepart(toDatetimeLocalValue(profile.trip_preferences.depart_at));
  }, [profile]);

  useEffect(() => {
    if (!replan || appliedReplan.current === replan.token) return;
    appliedReplan.current = replan.token;
    edited.current = true;
    setPrefs(resolveTripPreferences(replan.preferences));
    setDepart(toDatetimeLocalValue(replan.departAt));
    setFuel(Math.round(replan.fuelLevel * 100));
    setReplanDraft(null);
  }, [replan, setReplanDraft]);

  const changePrefs = (next: TripPreferences) => {
    edited.current = true;
    setPrefs(next);
  };

  const currentPrefs = () =>
    normalizePlannerPreferences(prefs, fromDatetimeLocalValue(depart));

  const saveSettings = async () => {
    setBusy("settings");
    setNote(null);
    if (!session) {
      setNote(m.planning.signInToSave);
      setBusy(null);
      return;
    }
    const trip_preferences = currentPrefs();
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_preferences }),
      });
      if (response.status === 503 && profile) {
        setProfile({ ...profile, trip_preferences });
        setNote(m.planning.settingsSaved);
        return;
      }
      if (!response.ok) {
        setNote(await readApiError(response, m.planning.settingsFailed));
        return;
      }
      const payload = (await response.json()) as { profile: Profile };
      setProfile(payload.profile);
      setNote(m.planning.settingsSaved);
    } catch {
      setNote(m.planning.settingsFailed);
    } finally {
      setBusy(null);
    }
  };

  const starRoute = async () => {
    if (!origin || !destination) return;
    setBusy("star");
    setNote(null);
    if (!session) {
      setNote(m.planning.signInToSave);
      setBusy(null);
      return;
    }
    const preferences = currentPrefs();
    try {
      const response = await fetch("/api/favorites/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${origin.label} → ${destination.label}`,
          origin: {
            label: origin.label,
            lng: origin.coords.lng,
            lat: origin.coords.lat,
          },
          destination: {
            label: destination.label,
            lng: destination.coords.lng,
            lat: destination.coords.lat,
          },
          preferences,
          plan: buildFavoriteEnvelope(
            {
              via: via
                ? [
                    {
                      label: via.label,
                      lng: via.coords.lng,
                      lat: via.coords.lat,
                    },
                  ]
                : [],
              depart_at: preferences.depart_at,
              fuel_level: fuel / 100,
            },
            tripPlan
          ),
        }),
      });
      if (!response.ok) {
        setNote(await readApiError(response, m.planning.starFailed));
        return;
      }
      setNote(m.planning.starred);
    } catch {
      setNote(m.planning.starFailed);
    } finally {
      setBusy(null);
    }
  };

  const sameEnds = Boolean(origin && destination && origin.id === destination.id);

  return (
    <WazeCard className="space-y-4">
      <LocationSearchInput
        key={origin?.id ?? "origin-empty"}
        id="origin"
        label={m.planning.from}
        value={origin}
        placeholder={m.planning.fromPlaceholder}
        onSelect={(place) => {
          edited.current = true;
          onOrigin(place);
        }}
      />
      <LocationSearchInput
        key={via?.id ?? "via-empty"}
        id="via"
        label={m.planning.via}
        value={via}
        placeholder={m.planning.viaPlaceholder}
        onSelect={(place) => {
          edited.current = true;
          onVia(place);
        }}
      />
      {via && (
        <button
          type="button"
          onClick={() => onVia(null)}
          className="text-sm text-[var(--waze-text-muted)] underline"
        >
          {m.planning.clearVia}
        </button>
      )}
      <LocationSearchInput
        key={destination?.id ?? "destination-empty"}
        id="destination"
        label={m.planning.to}
        value={destination}
        placeholder={m.planning.toPlaceholder}
        onSelect={(place) => {
          edited.current = true;
          onDestination(place);
        }}
      />
      <p className="text-xs leading-relaxed text-[var(--waze-text-muted)]">
        {m.planning.searchHint}
      </p>

      <label className="block text-sm text-[var(--waze-text)]" htmlFor="depart-at">
        {m.planning.depart}
        <input
          id="depart-at"
          type="datetime-local"
          value={depart}
          onChange={(event) => {
            edited.current = true;
            setDepart(event.target.value);
          }}
          className="mt-1 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
        />
      </label>
      <p className="text-xs text-[var(--waze-text-muted)]">{m.planning.departHint}</p>

      <section aria-labelledby="plan-car">
        <h2 id="plan-car" className="text-sm font-medium text-[var(--waze-text)]">
          {m.planning.car}
        </h2>
        <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
          {carSummary(profile)}
        </p>
        {profile && (
          <p className="mt-1 text-xs text-[var(--waze-accent-text)]">
            {m.planning.carFromProfile}
          </p>
        )}
        <Link
          href="/profile"
          className="mt-2 inline-block text-sm text-[var(--waze-accent-text)] underline"
        >
          {m.planning.carEdit}
        </Link>
      </section>

      <label className="block text-sm text-[var(--waze-text)]" htmlFor="fuel-level">
        {m.planning.fuelLevel}: {fuel}%
        <input
          id="fuel-level"
          type="range"
          min={10}
          max={100}
          step={5}
          value={fuel}
          onChange={(event) => setFuel(Number(event.target.value))}
          className="mt-2 w-full"
        />
      </label>

      <details open className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--waze-text)]">
          {m.planning.preferences}
        </summary>
        <div className="border-t border-[var(--waze-border)] px-4 py-3">
          <PreferenceFields value={prefs} onChange={changePrefs} />
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={busy !== null}
          className="waze-btn-secondary px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy === "settings" ? m.planning.savingSettings : m.planning.saveSettings}
        </button>
        <button
          type="button"
          onClick={() => void starRoute()}
          disabled={!origin || !destination || busy !== null}
          className="waze-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          <Star className="h-4 w-4" aria-hidden />
          {m.planning.starRoute}
        </button>
      </div>
      {note && (
        <p className="text-sm text-[var(--waze-text-secondary)]" role="status">
          {!session && note === m.planning.signInToSave ? (
            <Link href="/login" className="text-[var(--waze-accent-text)] underline">
              {note}
            </Link>
          ) : (
            note
          )}
        </p>
      )}
      {error && (
        <p className="text-sm text-[var(--waze-danger)]" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          onSubmit({
            preferences: currentPrefs(),
            departAt: fromDatetimeLocalValue(depart),
            fuelLevel: fuel / 100,
          })
        }
        disabled={calculating || !origin || !destination || sameEnds}
        className="waze-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
      >
        {calculating ? m.planning.calculating : m.planning.calculate}
      </button>
    </WazeCard>
  );
}

function carSummary(profile: Profile | null): string {
  if (!profile) return m.planning.carGuest;
  const name = profile.car?.trim() || m.vehicle[profile.vehicle_type];
  const fuel = m.fuel[profile.fuel_type];
  const size =
    profile.vehicle_type === "ev"
      ? profile.ev_range_km
        ? `${profile.ev_range_km} ${m.planning.km}`
        : null
      : profile.tank_capacity_liters
        ? `${profile.tank_capacity_liters} ${m.planning.liters}`
        : null;
  return [name, fuel, size].filter(Boolean).join(" · ");
}
