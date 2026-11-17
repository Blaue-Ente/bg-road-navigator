"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  currentLocationPreference,
  locationPreferenceServerSnapshot,
  locationPreferenceSnapshot,
  subscribeLocationPreference,
} from "@/lib/location/browser-pref";
import { shouldWatchLocation } from "@/lib/location/preference";
import { useBorderCrossingWatch } from "@/lib/hooks/useBorderCrossingWatch";
import { useBorderTimeStore } from "@/lib/stores/border-time.store";
import { useTripSessionStore } from "@/lib/stores/trip-session.store";
import { BorderTimePrompt } from "@/components/borders/BorderTimePrompt";

/**
 * Measures border waits during a trip (location allowed, trip mode on) and
 * shows the confirmation card, including one kept from before a reload.
 */
export function BorderTimeWatcher() {
  const raw = useSyncExternalStore(
    subscribeLocationPreference,
    locationPreferenceSnapshot,
    locationPreferenceServerSnapshot
  );
  const locationOptIn = raw ? currentLocationPreference().location_opt_in : false;
  const tripActive = useTripSessionStore((state) => state.active);
  const hydrate = useBorderTimeStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
    // A reminder opens /?border=<crossing>&wait=<minutes>: ask for the real wait.
    try {
      const params = new URLSearchParams(window.location.search);
      const crossingId = params.get("border");
      if (crossingId && /^[a-z0-9-]{2,60}$/.test(crossingId)) {
        const wait = Number.parseInt(params.get("wait") ?? "", 10);
        const minutes = Number.isFinite(wait) ? Math.min(720, Math.max(5, wait)) : 20;
        const now = Date.now();
        useBorderTimeStore.getState().offer({
          crossingId,
          startedAt: now - minutes * 60_000,
          endedAt: now,
          minutes,
          fromCountry: null,
          toCountry: null,
          reliable: false,
          origin: "estimate",
        });
        params.delete("border");
        params.delete("wait");
        const rest = params.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${rest ? `?${rest}` : ""}`);
      }
    } catch {
      // No address to read: the reminder simply opens the map.
    }
  }, [hydrate]);

  useBorderCrossingWatch(shouldWatchLocation({ locationOptIn, tripActive }));
  return <BorderTimePrompt />;
}
