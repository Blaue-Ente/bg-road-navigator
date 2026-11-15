import { DEFAULT_ALERT_AHEAD_M } from "@/lib/hotspots/alerts";

export const LOCATION_PREF_KEY = "bg-road-location";

export interface LocationPreference {
  location_opt_in: boolean;
  notifications_opt_in: boolean;
  alert_radius_m: number;
}

export const DEFAULT_LOCATION_PREFERENCE: LocationPreference = {
  location_opt_in: false,
  notifications_opt_in: false,
  alert_radius_m: DEFAULT_ALERT_AHEAD_M,
};

export function parseLocationPreference(
  raw: string | null | undefined
): LocationPreference {
  if (!raw) return { ...DEFAULT_LOCATION_PREFERENCE };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_LOCATION_PREFERENCE };
    }
    const record = parsed as Record<string, unknown>;
    return {
      location_opt_in: record.location_opt_in === true,
      notifications_opt_in: record.notifications_opt_in === true,
      alert_radius_m: clampRadius(record.alert_radius_m),
    };
  } catch {
    return { ...DEFAULT_LOCATION_PREFERENCE };
  }
}

export function serializeLocationPreference(pref: LocationPreference): string {
  return JSON.stringify({
    location_opt_in: pref.location_opt_in === true,
    notifications_opt_in: pref.notifications_opt_in === true,
    alert_radius_m: clampRadius(pref.alert_radius_m),
  });
}

/** Continuous GPS runs only during an explicit trip, and only after opt-in. */
export function shouldWatchLocation(input: {
  locationOptIn: boolean;
  tripActive: boolean;
}): boolean {
  return input.locationOptIn === true && input.tripActive === true;
}

function clampRadius(value: unknown): number {
  const radius = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(radius)) return DEFAULT_ALERT_AHEAD_M;
  return Math.min(5000, Math.max(200, Math.round(radius)));
}
