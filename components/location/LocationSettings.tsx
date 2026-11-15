"use client";

import { useSyncExternalStore } from "react";
import { WazeCard } from "@/components/ui/WazeCard";
import {
  currentLocationPreference,
  locationPreferenceServerSnapshot,
  locationPreferenceSnapshot,
  saveLocationPreference,
  subscribeLocationPreference,
} from "@/lib/location/browser-pref";
import type { LocationPreference } from "@/lib/location/preference";
import { useUserStore } from "@/lib/stores/user.store";

export function LocationSettings() {
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
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    update({ ...pref, notifications_opt_in: result === "granted" });
  };

  return (
    <WazeCard>
      <section aria-labelledby="location-settings">
        <h2
          id="location-settings"
          className="text-base font-semibold text-[var(--waze-text)]"
        >
          Местоположение
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
          Използва се за предупреждения за участъци с чести катастрофи и
          опасности по пътя, ремонти, предложения за почивка и по-късно
          забавяния в трафика.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
          Местоположението остава на устройството и не се записва на сървъра,
          освен ако по-късно не изберете да го споделяте.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-[var(--waze-text)]">
          <input
            type="checkbox"
            className="accent-[var(--waze-accent)]"
            checked={pref.location_opt_in}
            onChange={(event) =>
              update({ ...pref, location_opt_in: event.target.checked })
            }
          />
          Предупреждения по време на път
        </label>
        <label className="mt-3 block text-sm text-[var(--waze-text)]">
          Предупреждение на разстояние (м)
          <input
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
        <button
          type="button"
          onClick={() => void askNotifications()}
          className="mt-3 text-sm text-[var(--waze-accent-text)] underline"
        >
          {pref.notifications_opt_in
            ? "Известията са разрешени"
            : "Разреши известия на устройството"}
        </button>
      </section>
    </WazeCard>
  );
}
