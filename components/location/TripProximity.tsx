"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  alertsAhead,
  throttleAlerts,
  type AlertTarget,
} from "@/lib/hotspots/alerts";
import { HOTSPOT_ALERTS } from "@/lib/i18n/hotspot-alerts";
import {
  currentLocationPreference,
  locationPreferenceServerSnapshot,
  locationPreferenceSnapshot,
  subscribeLocationPreference,
} from "@/lib/location/browser-pref";
import { shouldWatchLocation } from "@/lib/location/preference";
import { useMapStore } from "@/lib/stores/map.store";
import { useRouteStore } from "@/lib/stores/route.store";
import { useTripSessionStore } from "@/lib/stores/trip-session.store";

export function TripProximity() {
  const raw = useSyncExternalStore(
    subscribeLocationPreference,
    locationPreferenceSnapshot,
    locationPreferenceServerSnapshot
  );
  const pref = raw
    ? currentLocationPreference()
    : {
        location_opt_in: false,
        notifications_opt_in: false,
        alert_radius_m: 1000,
      };
  const active = useTripSessionStore((state) => state.active);
  const banner = useTripSessionStore((state) => state.banner);
  const dismiss = useTripSessionStore((state) => state.dismiss);

  useEffect(() => {
    if (
      !shouldWatchLocation({
        locationOptIn: pref.location_opt_in,
        tripActive: active,
      })
    ) {
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const plan = useRouteStore.getState().tripPlan;
        const coordinates = plan?.route.geometry.coordinates;
        if (!plan || !coordinates || coordinates.length < 2) return;
        const line = coordinates.map(
          (point) => [point[0]!, point[1]!] as [number, number]
        );
        const targets: AlertTarget[] = [
          ...(plan.attention_segments ?? []).map((hotspot) => ({
            id: hotspot.id,
            lng: hotspot.lng,
            lat: hotspot.lat,
            kind: "hotspot" as const,
          })),
          ...(plan.road_hazards ?? []).map((hazard) => ({
            id: hazard.id,
            lng: hazard.lng,
            lat: hazard.lat,
            kind: "hazard" as const,
          })),
        ];
        const ahead = alertsAhead({
          line,
          position: {
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          },
          targets,
          aheadM: pref.alert_radius_m,
        });
        const gate = throttleAlerts(
          ahead,
          new Set(useTripSessionStore.getState().seen)
        );
        if (gate.fresh.length === 0) return;
        const first = gate.fresh[0]!;
        useTripSessionStore.getState().remember([...gate.seen], first.text);
        useMapStore.getState().setUserLocation({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          accuracy: position.coords.accuracy,
        });
        signal(first.text, first.id, pref.notifications_opt_in);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watch);
  }, [
    active,
    pref.location_opt_in,
    pref.alert_radius_m,
    pref.notifications_opt_in,
  ]);

  if (!banner) return null;

  const bannerNode = (
    <ProximityBanner text={banner} onDismiss={dismiss} />
  );

  if (typeof document === "undefined") return bannerNode;
  return createPortal(bannerNode, document.body);
}

export function ProximityBanner({
  text,
  onDismiss,
}: {
  text: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      data-proximity-banner
      className="pointer-events-auto fixed left-1/2 z-[80] w-[min(28rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-2xl bg-[#7c2d12] px-4 py-3 text-sm font-medium text-white shadow-lg top-[calc(0.75rem+env(safe-area-inset-top,0px))]"
    >
      <p>{text}</p>
      <button type="button" onClick={onDismiss} className="mt-1 text-xs underline">
        Затвори
      </button>
    </div>
  );
}

function signal(text: string, id: string, notifications: boolean): void {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate([180, 80, 180]);
  }
  beep();
  if (!notifications || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  const payload = {
    type: "hotspot-alert",
    title: HOTSPOT_ALERTS.title,
    body: text,
    tag: id,
  };
  const worker = navigator.serviceWorker?.controller;
  if (worker) worker.postMessage(payload);
  else
    new Notification(HOTSPOT_ALERTS.title, { body: text, tag: id, lang: "bg" });
}

function beep(): void {
  const Context =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Context) return;
  const audio = new Context();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = 880;
  oscillator.connect(gain);
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0.04, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.2);
  oscillator.onended = () => void audio.close();
}
