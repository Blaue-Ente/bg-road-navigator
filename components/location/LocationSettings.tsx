"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useSyncExternalStore } from "react";
import { WazeCard } from "@/components/ui/WazeCard";
import {
  currentLocationPreference,
  locationPreferenceServerSnapshot,
  locationPreferenceSnapshot,
  saveLocationPreference,
  subscribeLocationPreference,
} from "@/lib/location/browser-pref";
import {
  notificationPrompt,
  type BrowserNotificationPermission,
} from "@/lib/location/notifications";
import type { LocationPreference } from "@/lib/location/preference";
import { useUserStore } from "@/lib/stores/user.store";

function readNotificationPermission(): BrowserNotificationPermission {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

function subscribeNotificationPermission(onChange: () => void): () => void {
  window.addEventListener("focus", onChange);
  return () => window.removeEventListener("focus", onChange);
}

export function LocationSettings() {
  const m = useMessages();
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
  const session = useUserStore((state) => state.session);
  const permission = useSyncExternalStore(
    subscribeNotificationPermission,
    readNotificationPermission,
    () => "default" as const
  );
  const prompt = notificationPrompt(permission);

  const update = (next: LocationPreference) => {
    saveLocationPreference(next);
    if (!session) return;
    void fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trip_preferences: {
          location_opt_in: next.location_opt_in,
          notifications_opt_in: next.notifications_opt_in,
          alert_radius_m: next.alert_radius_m,
        },
      }),
    }).catch(() => undefined);
  };

  const askNotifications = async () => {
    if (permission !== "default" || typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    update({ ...pref, notifications_opt_in: result === "granted" });
  };

  return (
    <WazeCard>
      <section aria-labelledby="location-settings">
        <h2
          id="location-settings"
          className="text-base font-semibold text-[var(--waze-text)]"
        >{m.location.msg82bd05bd0a}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
          {m.location.msg999c46a3cc}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
          {m.location.msg41d387b638}
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-[var(--waze-text)]">
          <input
            type="checkbox"
            className="accent-[var(--waze-accent)]"
            checked={pref.location_opt_in}
            onChange={(event) =>
              update({ ...pref, location_opt_in: event.target.checked })
            }
          />{m.location.msgc92ced4d4f}</label>
        <label className="mt-3 block text-sm text-[var(--waze-text)]">{m.location.msg40e89328d0}<input
            type="number"
            min={200}
            max={5000}
            step={100}
            value={pref.alert_radius_m}
            onChange={(event) =>
              update({
                ...pref,
                alert_radius_m: Number(event.target.value) || 1000,
              })
            }
            className="mt-1 w-28 rounded-lg border border-[var(--waze-border)] bg-transparent px-2 py-1"
          />
        </label>
        {prompt.status === "ask" ? (
          <button
            type="button"
            onClick={() => void askNotifications()}
            className="mt-3 text-sm text-[var(--waze-accent-text)] underline"
          >
            {prompt.text}
          </button>
        ) : (
          <p className="mt-3 text-sm text-[var(--waze-text-secondary)]">
            {prompt.text}
          </p>
        )}
      </section>
    </WazeCard>
  );
}
