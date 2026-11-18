import type { PlanningVia } from "@/lib/stores/route.store";
import type { TripPlannerResult } from "@/lib/planner/types";
import type { Route } from "@/types/route.types";

export const ROUTE_TRIP_SESSION_KEY = "bg-road-trip-session";
export const ROUTE_TRIP_SESSION_VERSION = 1;
/** Skip persist when geometry-heavy plans exceed typical sessionStorage headroom. */
export const ROUTE_TRIP_SESSION_MAX_BYTES = 4_000_000;

export interface RouteTripSessionPayload {
  tripPlan: TripPlannerResult | null;
  activeRoute: Route | null;
  alternativeRoutes: Route[];
  planningVia: PlanningVia[];
  planDetailOpen: boolean;
}

export interface TripSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredEnvelope {
  v: number;
  data: RouteTripSessionPayload;
}

function isRouteTripSessionPayload(value: unknown): value is RouteTripSessionPayload {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    "tripPlan" in row &&
    "activeRoute" in row &&
    Array.isArray(row.alternativeRoutes) &&
    "planningVia" in row &&
    typeof row.planDetailOpen === "boolean"
  );
}

export function serializeRouteTripSession(
  payload: RouteTripSessionPayload
): string | null {
  try {
    const raw = JSON.stringify({
      v: ROUTE_TRIP_SESSION_VERSION,
      data: payload,
    } satisfies StoredEnvelope);
    if (raw.length > ROUTE_TRIP_SESSION_MAX_BYTES) return null;
    return raw;
  } catch {
    return null;
  }
}

export function parseRouteTripSession(raw: string | null): RouteTripSessionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const envelope = parsed as StoredEnvelope;
    if (envelope.v !== ROUTE_TRIP_SESSION_VERSION) return null;
    if (!isRouteTripSessionPayload(envelope.data)) return null;
    // Sessions saved with a single point (or none) read as a list.
    const via = (envelope.data as { planningVia: unknown }).planningVia;
    return {
      ...envelope.data,
      planningVia: Array.isArray(via)
        ? (via as PlanningVia[])
        : via && typeof via === "object"
          ? [via as PlanningVia]
          : [],
    };
  } catch {
    return null;
  }
}

export function writeRouteTripSession(
  storage: TripSessionStorage,
  payload: RouteTripSessionPayload
): boolean {
  const raw = serializeRouteTripSession(payload);
  if (!raw) return false;
  try {
    storage.setItem(ROUTE_TRIP_SESSION_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export function readRouteTripSession(
  storage: TripSessionStorage
): RouteTripSessionPayload | null {
  return parseRouteTripSession(storage.getItem(ROUTE_TRIP_SESSION_KEY));
}

export function clearRouteTripSession(storage: TripSessionStorage): void {
  try {
    storage.removeItem(ROUTE_TRIP_SESSION_KEY);
  } catch {
    // Private mode or blocked storage — in-memory state is still authoritative.
  }
}

export function tripSessionStorage(): TripSessionStorage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}