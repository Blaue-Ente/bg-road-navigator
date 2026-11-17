import type { Locale } from "@/lib/i18n/locale";
import type { TripPushPlan } from "@/lib/push/schedule";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import type { TripPlannerResult } from "@/lib/planner/types";

export function vapidPublicKey(): string {
  return (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    vapidPublicKey().length > 0
  );
}

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready;
}

/** The browser's current push subscription, if the driver already allowed it. */
export async function existingSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported() || Notification.permission !== "granted") return null;
  try {
    return await (await registration()).pushManager.getSubscription();
  } catch {
    return null;
  }
}

/** Asks permission (needs a tap), subscribes, and tells the server. */
export async function enablePush(locale: Locale): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const reg = await registration();
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(vapidPublicKey()),
    }));
  const json = subscription.toJSON();
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: json.keys,
      locale,
    }),
  });
  return response.ok ? subscription : null;
}

/** When the route reaches its border: after the stops before it, plus a short stay at each. */
function borderEta(plan: TripPlannerResult, speedKmh: number): string | null {
  const chosen = plan.border.chosen;
  if (!chosen) return null;
  const before = plan.stops
    .filter((stop) => stop.distance_from_start_km < chosen.distance_km)
    .sort((a, b) => b.distance_from_start_km - a.distance_from_start_km)[0];
  if (!before) {
    return new Date(Date.parse(plan.depart_at) + chosen.drive_min * 60_000).toISOString();
  }
  const rest = ((chosen.distance_km - before.distance_from_start_km) / speedKmh) * 3_600_000;
  return new Date(Date.parse(before.eta) + 15 * 60_000 + rest).toISOString();
}

export function pushPlanFromPlan(
  plan: TripPlannerResult,
  locale: Locale = "bg"
): TripPushPlan {
  const speed = Math.min(
    160,
    Math.max(20, plan.route.distance_km / Math.max(1, plan.route.duration_min / 60))
  );
  const chosen = plan.border.chosen;
  const eta = borderEta(plan, speed);
  return {
    border:
      chosen && eta
        ? {
            id: chosen.border_id.slice(0, 60),
            name: borderDisplayName(locale, {
              crossing_id: chosen.border_id,
              name_bg: chosen.name_bg,
              name_en: chosen.name_en,
            }).slice(0, 120),
            eta,
            wait_min: Math.min(720, Math.max(0, Math.round(chosen.wait.minutes))),
          }
        : null,
    depart_at: plan.depart_at,
    speed_kmh: Math.min(
      160,
      Math.max(20, plan.route.distance_km / Math.max(1, plan.route.duration_min / 60))
    ),
    stops: plan.stops.slice(0, 40).map((stop) => ({
      id: stop.id.slice(0, 60),
      title: stop.title.slice(0, 120),
      kinds: stop.kinds.slice(0, 4),
      eta: stop.eta,
      optional: stop.optional,
      saving_eur: stop.advice?.est_savings_eur ?? null,
    })),
    weather: plan.weather.segments.slice(0, 12).map((segment) => ({
      eta: segment.eta,
      weather_code: segment.weather_code,
      wind_kmh: segment.wind_kmh,
      precipitation_mm: segment.precipitation_mm,
      summary: segment.summary_bg.slice(0, 160),
      place: segment.place ?? null,
    })),
  };
}

export function tripId(plan: TripPlannerResult): string {
  return plan.generated_at.slice(0, 40);
}

export async function startTripPush(input: {
  endpoint: string;
  plan: TripPlannerResult;
  startedAt: Date;
  locale: Locale;
}): Promise<boolean> {
  try {
    const response = await fetch("/api/push/trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: input.endpoint,
        trip_id: tripId(input.plan),
        started_at: input.startedAt.toISOString(),
        locale: input.locale,
        plan: pushPlanFromPlan(input.plan, input.locale),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function stopTripPush(
  endpoint: string,
  plan: TripPlannerResult
): Promise<void> {
  try {
    await fetch("/api/push/trip", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, trip_id: tripId(plan) }),
    });
  } catch {
    // The pushes simply stop being relevant; a failed cancel is harmless.
  }
}
