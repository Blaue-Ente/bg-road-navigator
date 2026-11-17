"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Coffee,
  Flag,
  Fuel,
  MapPinOff,
  Navigation,
  Zap,
} from "lucide-react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { timeZoneLabel } from "@/lib/geo/country-timezone";
import { formatTemplate } from "@/lib/i18n/format-template";
import { localeTag } from "@/lib/i18n/locale";
import { unitsFrom } from "@/lib/i18n/units";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { formatClockDuration } from "@/lib/planner/itinerary";
import type { PlanStop, TripPlannerResult } from "@/lib/planner/types";
import { useMapStore } from "@/lib/stores/map.store";
import { useRouteStore } from "@/lib/stores/route.store";
import { useTripSessionStore } from "@/lib/stores/trip-session.store";
import { OFF_ROUTE_KM, tripProgress } from "@/lib/trip/progress";
import { wazeNavigateUrl } from "@/lib/utils/maps-handoff";

function StopIcon({ stop }: { stop: PlanStop | null }) {
  const className = "h-7 w-7";
  if (!stop) return <Flag className={className} aria-hidden />;
  if (stop.kinds.includes("overnight"))
    return <BedDouble className={className} aria-hidden />;
  if (stop.kinds.includes("charge")) return <Zap className={className} aria-hidden />;
  if (stop.kinds.includes("fuel")) return <Fuel className={className} aria-hidden />;
  return <Coffee className={className} aria-hidden />;
}

function isApple(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function navigateUrl(point: { lng: number; lat: number }): string {
  const target = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
  return isApple()
    ? `https://maps.apple.com/?daddr=${target}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=driving`;
}

/**
 * Big, high-contrast driving view: the next stop, how far and when, and the
 * arrival. It follows the position while the trip is on, keeps the screen on,
 * and works from the plan alone when there is no GPS fix.
 */
export function TripDashboard({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const units = unitsFrom(m);
  const stopTrip = useTripSessionStore((state) => state.stop);
  const setPlanDetailOpen = useRouteStore((state) => state.setPlanDetailOpen);
  const position = useMapStore((state) => state.userLocation);
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [gpsDenied, setGpsDenied] = useState(false);
  // Only shown once the trip is on, so this never runs during server rendering.
  const geoSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
  const gpsFailed = gpsDenied || !geoSupported;
  const awake = useWakeLock(true);

  // Starting the trip is the opt-in: follow the position until it ends.
  useEffect(() => {
    if (!geoSupported) return;
    const watch = navigator.geolocation.watchPosition(
      (fix) => {
        setGpsDenied(false);
        setUserLocation({
          lng: fix.coords.longitude,
          lat: fix.coords.latitude,
          accuracy: fix.coords.accuracy,
        });
      },
      () => setGpsDenied(true),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [geoSupported, setUserLocation]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const progress = useMemo(
    () =>
      tripProgress({
        plan,
        position: position ? { lng: position.lng, lat: position.lat } : null,
        nowMs,
      }),
    [plan, position, nowMs]
  );

  const clock = (ms: number, timeZone?: string | null) =>
    new Intl.DateTimeFormat(localeTag(locale), {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date(ms));

  const next = progress.next;
  const destination = plan.route.destination;
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const arrivalZone =
    destination.time_zone && destination.time_zone !== deviceZone
      ? destination.time_zone
      : null;
  const offRoute =
    progress.offRouteKm != null && progress.offRouteKm > OFF_ROUTE_KM;
  const target = next?.stop.coords ?? destination;

  return (
    <section
      aria-label={m.trip.title}
      data-trip-dashboard
      className="pointer-events-auto fixed inset-x-3 z-30 rounded-3xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-4 shadow-2xl bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:inset-x-auto md:bottom-6 md:left-3 md:w-[26rem]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-accent-text)]">
          {next ? m.trip.nextStop : m.trip.toDestination}
        </p>
        <p className="text-xs text-[var(--waze-text-muted)]" role="status">
          {gpsFailed
            ? m.trip.gpsOff
            : position
              ? awake
                ? m.trip.keepAwake
                : m.trip.following
              : m.trip.waitingGps}
        </p>
      </div>

      <div className="mt-2 flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--waze-accent)] text-white">
          <StopIcon stop={next ? next.stop : null} />
        </span>
        <div className="min-w-0">
          <p className="break-words text-2xl font-bold leading-tight text-[var(--waze-text)]">
            {next ? next.stop.title : destination.label}
          </p>
          {next?.stop.place_name && next.stop.place_name !== next.stop.title ? (
            <p className="truncate text-base text-[var(--waze-text-secondary)]">
              {next.stop.place_name}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[var(--waze-text)]">
        <div className="rounded-2xl bg-[var(--waze-surface-elevated)] px-3 py-2">
          <p className="text-3xl font-bold leading-none">
            {Math.round(next ? next.distanceKm : progress.remainingKm)}
            <span className="ml-1 text-base font-semibold">{m.units.km}</span>
          </p>
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
            {m.trip.distance}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--waze-surface-elevated)] px-3 py-2">
          <p className="text-3xl font-bold leading-none">
            {clock(next ? next.etaMs : progress.arriveMs, next ? null : arrivalZone)}
          </p>
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
            {formatTemplate(m.trip.inTime, {
              duration: formatClockDuration(
                ((next ? next.etaMs : progress.arriveMs) - nowMs) / 60_000,
                units
              ),
            })}
          </p>
        </div>
      </div>

      <p className="mt-3 text-base text-[var(--waze-text)]">
        {formatTemplate(m.trip.remaining, {
          km: String(Math.round(progress.remainingKm)),
          unit: m.units.km,
          time: clock(progress.arriveMs, arrivalZone),
        })}
        {arrivalZone ? ` (${timeZoneLabel(arrivalZone, locale)})` : ""}
      </p>

      {offRoute && (
        <p
          className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--waze-warning-bg,#fef3c7)] px-3 py-2 text-sm font-medium text-[#7c2d12]"
          role="alert"
        >
          <MapPinOff className="h-4 w-4 shrink-0" aria-hidden />
          {formatTemplate(m.trip.offRoute, {
            km: String(Math.round(progress.offRouteKm ?? 0)),
            unit: m.units.km,
          })}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={navigateUrl(target)}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--waze-accent)] px-4 text-base font-bold text-white"
        >
          <Navigation className="h-5 w-5" aria-hidden />
          {next ? m.trip.navigateStop : m.trip.navigateDestination}
        </a>
        <Link
          href="/fuel?route=1"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 text-base font-semibold text-[var(--waze-text)]"
        >
          <Fuel className="h-5 w-5" aria-hidden />
          {m.trip.fuelNearby}
        </Link>
        <a
          href={wazeNavigateUrl(target)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 text-base font-semibold text-[var(--waze-text)]"
        >
          Waze
        </a>
        <button
          type="button"
          onClick={() => setPlanDetailOpen(true)}
          className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 text-base font-semibold text-[var(--waze-text)]"
        >
          {m.trip.openPlan}
        </button>
        <button
          type="button"
          onClick={stopTrip}
          className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[var(--waze-danger)] px-3 text-base font-semibold text-[var(--waze-danger)]"
        >
          {m.trip.end}
        </button>
      </div>
    </section>
  );
}
