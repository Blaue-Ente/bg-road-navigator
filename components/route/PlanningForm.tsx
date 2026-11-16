"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Star } from "lucide-react";
import { LocationSearchInput } from "@/components/route/LocationSearchInput";
import { PreferenceFields } from "@/components/route/PreferenceFields";
import { WazeCard } from "@/components/ui/WazeCard";
import { readApiError } from "@/lib/client/read-api-error";
import { buildFavoriteEnvelope } from "@/lib/planner/favorite-envelope";
import {
  fromDatetimeLocalValue,
  normalizePlannerPreferences,
} from "@/lib/planner/form-preferences";
import type { PlannerDraft } from "@/lib/planner/planner-draft";
import type { TripPreferences } from "@/lib/planner/preferences";
import { timeZoneForCountry, timeZoneLabel } from "@/lib/geo/country-timezone";
import { formatTemplate } from "@/lib/i18n/format-template";
import {
  formatDepartInTimeZone,
  formatDepartLocaleDisplay,
  proposedDepartLocalValue,
} from "@/lib/planner/proposed-depart";
import { useRouteStore } from "@/lib/stores/route.store";
import { useUserStore, type Profile } from "@/lib/stores/user.store";
import type { MessageCatalog } from "@/lib/i18n/locales/bg";
import { localeTag } from "@/lib/i18n/locale";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider";
import { committedPlace } from "@/lib/route/place-commit";
import { hasAdvancedPlannerOptions } from "@/lib/route/planner-advanced";

export interface PlanningSubmit {
  preferences: TripPreferences;
  departAt: string | null;
  fuelLevel: number;
}

export function PlanningForm({
  draft,
  onChange,
  onReset,
  calculating,
  error,
  onSubmit,
  originQuery,
  destinationQuery,
  onOriginQueryChange,
  onDestinationQueryChange,
  onViaQueryChange,
}: {
  draft: PlannerDraft;
  onChange: (partial: Partial<PlannerDraft>) => void;
  onReset: () => void;
  calculating: boolean;
  error: string | null;
  onSubmit: (draft: PlanningSubmit) => void;
  originQuery: string;
  destinationQuery: string;
  onOriginQueryChange: (query: string) => void;
  onDestinationQueryChange: (query: string) => void;
  onViaQueryChange: (query: string) => void;
}) {
  const m = useMessages();
  const locale = useLocale();
  const profile = useUserStore((state) => state.profile);
  const session = useUserStore((state) => state.session);
  const setProfile = useUserStore((state) => state.setProfile);
  const tripPlan = useRouteStore((state) => state.tripPlan);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"settings" | "star" | null>(null);
  const { origin, destination, via } = draft;
  const prefs = draft.preferences;
  const depart = draft.departLocal;
  const fuel = draft.fuelPercent;
  const proposedDepart = useMemo(() => proposedDepartLocalValue(), []);
  const morePanelId = useId();
  const [moreOpen, setMoreOpen] = useState(false);
  const autoExpandedMore = useRef(false);

  const advancedActive = useMemo(
    () =>
      hasAdvancedPlannerOptions({
        via,
        fuelPercent: fuel,
        departLocal: depart,
        preferences: prefs,
        proposedDepart,
      }),
    [via, fuel, depart, prefs, proposedDepart]
  );

  useEffect(() => {
    if (!advancedActive || autoExpandedMore.current) return;
    autoExpandedMore.current = true;
    queueMicrotask(() => setMoreOpen(true));
  }, [advancedActive]);

  const changePrefs = (next: TripPreferences) => {
    onChange({ preferences: next });
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

  const committedOrigin = committedPlace(origin, originQuery);
  const committedDestination = committedPlace(destination, destinationQuery);
  const sameEnds = Boolean(
    committedOrigin &&
      committedDestination &&
      committedOrigin.id === committedDestination.id
  );

  const departValue = depart || proposedDepart;
  const deviceTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );
  const departDisplay = formatDepartLocaleDisplay(departValue, localeTag(locale));
  const departYourLine =
    departDisplay &&
    formatTemplate(m.planning.departYourTime, {
      datetime: departDisplay,
      zone: timeZoneLabel(deviceTimeZone, locale),
    });
  const originForZone = committedOrigin;
  const originTimeZone = originForZone?.countryCode
    ? timeZoneForCountry(originForZone.countryCode)
    : null;
  const originDepartLine =
    originTimeZone &&
    originTimeZone !== deviceTimeZone &&
    originForZone
      ? formatTemplate(m.planning.departOriginTime, {
          place: originForZone.label.split(",")[0]?.trim() || originForZone.label,
          time:
            formatDepartInTimeZone(
              departValue,
              localeTag(locale),
              originTimeZone
            ) ?? departDisplay ?? "",
        })
      : null;

  return (
    <WazeCard className="space-y-4">
      <LocationSearchInput
        id="origin"
        label={m.planning.from}
        value={origin}
        placeholder={m.planning.fromPlaceholder}
        onSelect={(place) => onChange({ origin: place, corridorId: null })}
        onQueryChange={onOriginQueryChange}
      />
      <LocationSearchInput
        id="destination"
        label={m.planning.to}
        value={destination}
        placeholder={m.planning.toPlaceholder}
        onSelect={(place) => onChange({ destination: place, corridorId: null })}
        onQueryChange={onDestinationQueryChange}
      />
      <p className="text-xs leading-relaxed text-[var(--waze-text-muted)]">
        {m.planning.searchHint}
      </p>

      <label className="block text-sm text-[var(--waze-text)]" htmlFor="depart-at">
        {m.planning.depart}
        <input
          id="depart-at"
          type="datetime-local"
          lang={locale}
          value={depart || proposedDepart}
          onChange={(event) => onChange({ departLocal: event.target.value })}
          className="mt-1 min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2 text-sm"
        />
      </label>
      {departYourLine ? (
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {departYourLine}
        </p>
      ) : null}
      {originDepartLine ? (
        <p className="text-xs text-[var(--waze-text-muted)]">{originDepartLine}</p>
      ) : null}
      <p className="text-xs text-[var(--waze-text-muted)]">
        {m.planning.departProposed}
      </p>

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
            departAt: fromDatetimeLocalValue(depart || proposedDepart),
            fuelLevel: fuel / 100,
          })
        }
        disabled={sameEnds}
        aria-busy={calculating}
        className={`waze-btn-primary min-h-11 w-full py-3.5 text-sm ${
          calculating ? "" : "disabled:opacity-50"
        }`}
      >
        {calculating ? m.planning.calculating : m.planning.calculate}
      </button>
      {calculating && (
        <p className="text-sm text-[var(--waze-text-secondary)]" role="status">
          {m.planning.calculatingStatus}
        </p>
      )}

      <div className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)]">
        <button
          type="button"
          id={`${morePanelId}-toggle`}
          aria-expanded={moreOpen}
          aria-controls={morePanelId}
          onClick={() => setMoreOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-[var(--waze-text)]"
        >
          <span className="inline-flex items-center gap-2">
            {m.planning.moreOptions}
            {advancedActive && !moreOpen && (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--waze-accent)]"
                aria-label={m.planning.moreOptionsActive}
              />
            )}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-[var(--waze-text-muted)] transition-transform ${
              moreOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
        {moreOpen && (
          <div
            id={morePanelId}
            role="region"
            aria-labelledby={`${morePanelId}-toggle`}
            className="space-y-4 border-t border-[var(--waze-border)] px-4 py-4"
          >
            <LocationSearchInput
              id="via"
              label={m.planning.via}
              value={via}
              placeholder={m.planning.viaPlaceholder}
              onSelect={(place) => onChange({ via: place })}
              onQueryChange={onViaQueryChange}
            />
            {via && (
              <button
                type="button"
                onClick={() => onChange({ via: null })}
                className="text-sm text-[var(--waze-text-muted)] underline"
              >
                {m.planning.clearVia}
              </button>
            )}

            <section aria-labelledby="plan-car">
              <h2
                id="plan-car"
                className="text-sm font-medium text-[var(--waze-text)]"
              >
                {m.planning.car}
              </h2>
              <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
                {carSummary(profile, m)}
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

            <label
              className="block text-sm text-[var(--waze-text)]"
              htmlFor="fuel-level"
            >
              {m.planning.fuelLevel}: {fuel}%
              <input
                id="fuel-level"
                type="range"
                min={10}
                max={100}
                step={5}
                value={fuel}
                onChange={(event) =>
                  onChange({ fuelPercent: Number(event.target.value) })
                }
                className="mt-2 w-full"
              />
            </label>

            <PreferenceFields value={prefs} onChange={changePrefs} />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={busy !== null}
                className="waze-btn-secondary min-h-11 px-4 py-2 text-sm disabled:opacity-50"
              >
                {busy === "settings"
                  ? m.planning.savingSettings
                  : m.planning.saveSettings}
              </button>
              <button
                type="button"
                onClick={() => void starRoute()}
                disabled={!origin || !destination || busy !== null}
                className="waze-btn-secondary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
              >
                <Star className="h-4 w-4" aria-hidden />
                {m.planning.starRoute}
              </button>
            </div>
            {note && (
              <p className="text-sm text-[var(--waze-text-secondary)]" role="status">
                {!session && note === m.planning.signInToSave ? (
                  <Link
                    href="/login"
                    className="text-[var(--waze-accent-text)] underline"
                  >
                    {note}
                  </Link>
                ) : (
                  note
                )}
              </p>
            )}

            <button
              type="button"
              onClick={onReset}
              disabled={calculating}
              className="waze-btn-secondary min-h-11 w-full py-3 text-sm disabled:opacity-50"
            >
              {m.planning.reset}
            </button>
          </div>
        )}
      </div>
    </WazeCard>
  );
}

function carSummary(profile: Profile | null, m: MessageCatalog): string {
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