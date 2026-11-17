"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BedDouble,
  Bell,
  Coffee,
  Flag,
  Fuel,
  MapPinOff,
  Navigation,
  RotateCw,
  Undo2,
  X,
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
import {
  enablePush,
  existingSubscription,
  pushSupported,
  startTripPush,
  vapidPublicKey,
  stopTripPush,
} from "@/lib/push/client";
import { lineLengthKm } from "@/lib/planner/line";
import { tripNotices, type TripNotice } from "@/lib/trip/notices";
import {
  nextTurn,
  placeManeuvers,
  turnArrow,
  type TurnArrow,
} from "@/lib/trip/next-turn";
import { OFF_ROUTE_KM, tripProgress } from "@/lib/trip/progress";
import { wazeNavigateUrl } from "@/lib/utils/maps-handoff";

function StopIcon({ stop }: { stop: PlanStop | null }) {
  const className = "h-7 w-7";
  if (!stop) return <Flag className={className} aria-hidden />;
  if (stop.kinds.includes("overnight"))
    return <BedDouble className={className} aria-hidden />;
  if (stop.kinds.includes("charge"))
    return <Zap className={className} aria-hidden />;
  if (stop.kinds.includes("fuel"))
    return <Fuel className={className} aria-hidden />;
  return <Coffee className={className} aria-hidden />;
}

const TURN_BETA_KEY = "bg-road-turn-beta";
/** Closer than this (metres) the turn is shown as a big tile. */
const TURN_NEAR_M = 600;

function subscribeTurnBeta(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("bg-turn-beta", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("bg-turn-beta", onChange);
  };
}

function readTurnBeta(): boolean {
  try {
    return localStorage.getItem(TURN_BETA_KEY) === "1";
  } catch {
    return false;
  }
}

function writeTurnBeta(on: boolean) {
  try {
    if (on) localStorage.setItem(TURN_BETA_KEY, "1");
    else localStorage.removeItem(TURN_BETA_KEY);
  } catch {
    // Private mode: the choice then only lasts until the page reloads.
  }
  window.dispatchEvent(new Event("bg-turn-beta"));
}

function TurnIcon({ arrow, small }: { arrow: TurnArrow; small?: boolean }) {
  const className = small ? "h-5 w-5" : "h-9 w-9";
  if (arrow === "left") return <ArrowLeft className={className} aria-hidden />;
  if (arrow === "right")
    return <ArrowRight className={className} aria-hidden />;
  if (arrow === "uturn") return <Undo2 className={className} aria-hidden />;
  if (arrow === "roundabout")
    return <RotateCw className={className} aria-hidden />;
  if (arrow === "arrive") return <Flag className={className} aria-hidden />;
  return <ArrowUp className={className} aria-hidden />;
}

function showSystemNotice(
  title: string,
  body: string,
  tag: string,
  lang: string
) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  // In the foreground the on-screen card is enough.
  if (document.visibilityState === "visible") return;
  const options = { body, tag, lang };
  const worker = navigator.serviceWorker;
  if (worker?.ready) {
    void worker.ready
      .then((registration) => registration.showNotification(title, options))
      .catch(() => new Notification(title, options));
  } else {
    new Notification(title, options);
  }
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
  const geoSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;
  const gpsFailed = gpsDenied || !geoSupported;
  const awake = useWakeLock(true);
  const turnBetaOn = useSyncExternalStore(
    subscribeTurnBeta,
    readTurnBeta,
    () => false
  );
  const [showConsent, setShowConsent] = useState(false);
  // Slim by default so the map stays visible; "More" opens every control.
  const [compact, setCompact] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [notifyPermission, setNotifyPermission] = useState<
    NotificationPermission | "none"
  >(() =>
    typeof Notification === "undefined" ? "none" : Notification.permission
  );
  const announced = useRef<Set<string>>(new Set());
  const [pushState, setPushState] = useState<
    "off" | "on" | "failed" | "unsupported"
  >("off");
  const pushEndpoint = useRef<string | null>(null);
  const tripStartedAt = useRef(new Date());

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

  // Already allowed on this phone: schedule this trip's notices right away.
  useEffect(() => {
    let cancelled = false;
    void existingSubscription().then(async (subscription) => {
      if (cancelled || !subscription) return;
      const ok = await startTripPush({
        endpoint: subscription.endpoint,
        plan,
        startedAt: tripStartedAt.current,
        locale,
      });
      if (cancelled || !ok) return;
      pushEndpoint.current = subscription.endpoint;
      setPushState("on");
    });
    return () => {
      cancelled = true;
    };
  }, [plan, locale]);

  const turnPushOn = async () => {
    // Push keys not set up on the server: fall back to notices while the page is open.
    if (!vapidPublicKey() && typeof Notification !== "undefined") {
      setNotifyPermission(await Notification.requestPermission());
      return;
    }
    if (!pushSupported()) {
      setPushState("unsupported");
      return;
    }
    try {
      const subscription = await enablePush(locale);
      if (!subscription) {
        setNotifyPermission(
          typeof Notification === "undefined" ? "none" : Notification.permission
        );
        setPushState("failed");
        return;
      }
      const ok = await startTripPush({
        endpoint: subscription.endpoint,
        plan,
        startedAt: tripStartedAt.current,
        locale,
      });
      pushEndpoint.current = ok ? subscription.endpoint : null;
      setNotifyPermission("granted");
      setPushState(ok ? "on" : "failed");
    } catch {
      setPushState("failed");
    }
  };

  const endTrip = () => {
    if (pushEndpoint.current) void stopTripPush(pushEndpoint.current, plan);
    stopTrip();
  };

  const notices = useMemo(
    () => tripNotices({ plan, progress }),
    [plan, progress]
  );
  const noticeText = (notice: TripNotice) =>
    formatTemplate(
      {
        rest: m.trip.noticeRest,
        restSoon: m.trip.noticeRestSoon,
        weather: m.trip.noticeWeather,
        fuel: m.trip.noticeFuel,
      }[notice.kind],
      notice.values
    )
      .replace(/\s{2,}/g, " ")
      .trim();
  const visibleNotices = notices.filter((notice) => !dismissed.has(notice.id));

  // Tell the driver once per notice, also when the app is in the background.
  useEffect(() => {
    for (const notice of notices) {
      if (announced.current.has(notice.id)) continue;
      announced.current.add(notice.id);
      showSystemNotice(
        m.trip.noticeTitle,
        noticeText(notice),
        `trip-${notice.id}`,
        locale
      );
    }
    // noticeText only reads m and notice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices, m, locale]);

  const line = useMemo(
    () =>
      plan.route.geometry.coordinates.map(
        (point) => [point[0]!, point[1]!] as [number, number]
      ),
    [plan]
  );
  const turns = useMemo(() => {
    if (!turnBetaOn || !plan.route.maneuvers?.length) return null;
    const geometryKm = lineLengthKm(line);
    const scale = geometryKm > 0 ? plan.route.distance_km / geometryKm : 1;
    return placeManeuvers(plan.route.maneuvers, line, scale);
  }, [turnBetaOn, plan, line]);
  const upcomingTurn = turns ? nextTurn(turns, progress.alongKm) : null;
  // The big turn tile only appears when the turn is close; far away it is one line.
  const turnNear =
    upcomingTurn != null && upcomingTurn.distanceM <= TURN_NEAR_M;
  const turnDistanceText = upcomingTurn
    ? upcomingTurn.distanceM >= 1000
      ? formatTemplate(m.trip.turnInKm, {
          distance: (upcomingTurn.distanceM / 1000).toFixed(1),
        })
      : formatTemplate(m.trip.turnInM, {
          distance: String(Math.round(upcomingTurn.distanceM / 10) * 10),
        })
    : "";
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
      className="pointer-events-auto fixed inset-x-3 z-30 max-h-[calc(100dvh-11rem)] overflow-y-auto overscroll-contain rounded-3xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-4 shadow-2xl bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:inset-x-auto md:bottom-6 md:left-3 md:w-[26rem]"
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

      {visibleNotices.map((notice) => (
        <div
          key={notice.id}
          role="status"
          className="mt-3 flex items-start gap-2 rounded-2xl bg-[#fff7ed] px-3 py-2 text-base font-medium text-[#7c2d12]"
        >
          <p className="min-w-0 flex-1">{noticeText(notice)}</p>
          <button
            type="button"
            aria-label={m.trip.noticeDismiss}
            onClick={() =>
              setDismissed((current) => new Set(current).add(notice.id))
            }
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ))}

      {turnBetaOn && upcomingTurn && !turnNear ? (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2 text-[var(--waze-text)]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--waze-accent)] text-white">
            <TurnIcon arrow={turnArrow(upcomingTurn.turn.maneuver)} small />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">
            {turnDistanceText}
            <span className="font-normal text-[var(--waze-text-secondary)]">
              {" · "}
              {upcomingTurn.turn.maneuver.instruction_bg}
            </span>
          </p>
          <button
            type="button"
            onClick={() => writeTurnBeta(false)}
            className="min-h-11 shrink-0 text-xs text-[var(--waze-text-muted)] underline"
          >
            {m.trip.turnOff}
          </button>
        </div>
      ) : turnBetaOn ? (
        <div className="mt-3 rounded-2xl bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-accent-text)]">
              {m.trip.turnBeta}
            </p>
            <button
              type="button"
              onClick={() => writeTurnBeta(false)}
              className="min-h-11 text-xs text-[var(--waze-text-muted)] underline"
            >
              {m.trip.turnOff}
            </button>
          </div>
          {!plan.route.maneuvers?.length ? (
            <p className="text-sm">{m.trip.turnUnavailable}</p>
          ) : upcomingTurn ? (
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--waze-accent)] text-white">
                <TurnIcon arrow={turnArrow(upcomingTurn.turn.maneuver)} />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight">
                  {turnDistanceText}
                </p>
                <p className="text-base text-[var(--waze-text-secondary)]">
                  {upcomingTurn.turn.maneuver.instruction_bg}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm">{m.trip.turnNone}</p>
          )}
        </div>
      ) : showConsent ? (
        <div
          className="mt-3 rounded-2xl border border-[var(--waze-border)] px-3 py-3 text-[var(--waze-text)]"
          role="dialog"
          aria-label={m.trip.turnConsentTitle}
        >
          <p className="text-base font-bold">{m.trip.turnConsentTitle}</p>
          <p className="mt-1 text-sm leading-snug">{m.trip.turnConsentBody}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                writeTurnBeta(true);
                setShowConsent(false);
              }}
              className="min-h-12 rounded-2xl bg-[var(--waze-accent)] px-3 text-sm font-bold text-white"
            >
              {m.trip.turnAccept}
            </button>
            <button
              type="button"
              onClick={() => setShowConsent(false)}
              className="min-h-12 rounded-2xl border border-[var(--waze-border)] px-3 text-sm font-semibold"
            >
              {m.trip.turnDecline}
            </button>
          </div>
        </div>
      ) : null}

      {compact ? (
        <p className="mt-2 text-base font-semibold text-[var(--waze-text)]">
          {Math.round(next ? next.distanceKm : progress.remainingKm)}{" "}
          {m.units.km}
          {" · "}
          {clock(
            next ? next.etaMs : progress.arriveMs,
            next ? null : arrivalZone
          )}
          <span className="font-normal text-[var(--waze-text-secondary)]">
            {" · "}
            {formatTemplate(m.trip.inTime, {
              duration: formatClockDuration(
                ((next ? next.etaMs : progress.arriveMs) - nowMs) / 60_000,
                units
              ),
            })}
          </span>
        </p>
      ) : null}

      <div
        className={`mt-3 grid grid-cols-2 gap-2 text-[var(--waze-text)] ${compact ? "hidden" : ""}`}
      >
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
            {clock(
              next ? next.etaMs : progress.arriveMs,
              next ? null : arrivalZone
            )}
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

      <p
        className={`mt-3 text-base text-[var(--waze-text)] ${compact ? "hidden" : ""}`}
      >
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

      {pushState === "on" && (
        <p
          className="mt-3 text-sm text-[var(--waze-text-secondary)]"
          role="status"
        >
          {m.trip.pushActive}
        </p>
      )}
      {pushState === "unsupported" && (
        <p
          className="mt-3 text-sm text-[var(--waze-text-secondary)]"
          role="status"
        >
          {m.trip.pushUnsupported}
        </p>
      )}
      {pushState === "failed" && (
        <p className="mt-3 text-sm text-[var(--waze-danger)]" role="alert">
          {m.trip.pushFailed}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {!turnBetaOn && !showConsent && !compact && (
          <button
            type="button"
            onClick={() => setShowConsent(true)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--waze-border)] px-3 text-sm font-semibold text-[var(--waze-text)]"
          >
            {m.trip.turnBeta}
          </button>
        )}
        {pushState !== "on" && notifyPermission !== "none" && !compact && (
          <button
            type="button"
            onClick={() => void turnPushOn()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--waze-border)] px-3 text-sm font-semibold text-[var(--waze-text)]"
          >
            <Bell className="h-4 w-4" aria-hidden />
            {m.trip.pushOn}
          </button>
        )}
        <a
          href={navigateUrl(target)}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--waze-accent)] px-4 text-base font-bold text-white"
        >
          <Navigation className="h-5 w-5" aria-hidden />
          {next ? m.trip.navigateStop : m.trip.navigateDestination}
        </a>
        <button
          type="button"
          onClick={() => setCompact((value) => !value)}
          aria-expanded={!compact}
          className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--waze-border)] px-3 text-sm font-semibold text-[var(--waze-text)]"
        >
          {compact ? m.trip.panelMore : m.trip.panelLess}
        </button>
        <Link
          href="/fuel?route=1"
          className={
            compact
              ? "hidden"
              : "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 text-base font-semibold text-[var(--waze-text)]"
          }
        >
          <Fuel className="h-5 w-5" aria-hidden />
          {m.trip.fuelNearby}
        </Link>
        <a
          href={wazeNavigateUrl(target)}
          target="_blank"
          rel="noopener noreferrer"
          className={
            compact
              ? "hidden"
              : "inline-flex min-h-14 items-center justify-center rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 text-base font-semibold text-[var(--waze-text)]"
          }
        >
          Waze
        </a>
        <button
          type="button"
          onClick={() => setPlanDetailOpen(true)}
          className={
            compact
              ? "hidden"
              : "inline-flex min-h-14 items-center justify-center rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 text-base font-semibold text-[var(--waze-text)]"
          }
        >
          {m.trip.openPlan}
        </button>
        <button
          type="button"
          onClick={endTrip}
          className={
            compact
              ? "hidden"
              : "inline-flex min-h-14 items-center justify-center rounded-2xl border border-[var(--waze-danger)] px-3 text-base font-semibold text-[var(--waze-danger)]"
          }
        >
          {m.trip.end}
        </button>
      </div>
    </section>
  );
}
