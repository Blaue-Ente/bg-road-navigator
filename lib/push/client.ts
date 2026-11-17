import type { Locale } from "@/lib/i18n/locale";
import type { TripPushPlan } from "@/lib/push/schedule";
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

export function pushPlanFromPlan(plan: TripPlannerResult): TripPushPlan {
  return {
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
        plan: pushPlanFromPlan(input.plan),
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
