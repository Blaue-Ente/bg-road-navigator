import {
  LOCATION_PREF_KEY,
  parseLocationPreference,
  serializeLocationPreference,
  type LocationPreference,
} from "@/lib/location/preference";

const listeners = new Set<() => void>();
let snapshot = "";

function readRaw(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(LOCATION_PREF_KEY) ?? "";
  } catch {
    return "";
  }
}

export function subscribeLocationPreference(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function locationPreferenceSnapshot(): string {
  if (!snapshot) snapshot = readRaw();
  return snapshot;
}

export function locationPreferenceServerSnapshot(): string {
  return "";
}

export function currentLocationPreference(): LocationPreference {
  return parseLocationPreference(locationPreferenceSnapshot() || null);
}

export function saveLocationPreference(pref: LocationPreference): void {
  const raw = serializeLocationPreference(pref);
  snapshot = raw;
  try {
    localStorage.setItem(LOCATION_PREF_KEY, raw);
  } catch {
    // A private window can refuse storage. The in-memory snapshot still applies.
  }
  for (const listener of listeners) listener();
}
