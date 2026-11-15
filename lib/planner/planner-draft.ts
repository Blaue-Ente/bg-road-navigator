import { proposedDepartLocalValue } from "@/lib/planner/proposed-depart";
import { resolveTripPreferences, type TripPreferences } from "@/lib/planner/preferences";
import type { RoutePoint } from "@/types/route.types";

export const PLANNER_DRAFT_KEY = "bg-road-planner-draft";

/** Form fields for one trip. The car stays on the profile and is not stored here. */
export interface PlannerDraft {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  via: RoutePoint | null;
  corridorId: string | null;
  preferences: TripPreferences;
  /** Value of the datetime-local input (Europe/Sofia morning default when unset). */
  departLocal: string;
  fuelPercent: number;
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SOURCES = new Set<RoutePoint["source"]>(["curated", "geocoder", "user"]);
const DEPART_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function createPlannerDraft(input: {
  origin?: RoutePoint | null;
  destination?: RoutePoint | null;
  via?: RoutePoint | null;
  corridorId?: string | null;
  preferences?: TripPreferences;
  departLocal?: string;
  fuelPercent?: number;
}): PlannerDraft {
  return {
    origin: input.origin ?? null,
    destination: input.destination ?? null,
    via: input.via ?? null,
    corridorId: input.corridorId ?? null,
    preferences: input.preferences ?? resolveTripPreferences(),
    departLocal: input.departLocal ?? proposedDepartLocalValue(),
    fuelPercent: clampFuel(input.fuelPercent ?? 80),
  };
}

/** One field changes. Origin, preferences, fuel and the rest stay unless named. */
export function patchPlannerDraft(
  current: PlannerDraft,
  partial: Partial<PlannerDraft>
): PlannerDraft {
  return {
    ...current,
    ...partial,
    preferences: partial.preferences ?? current.preferences,
    fuelPercent: clampFuel(partial.fuelPercent ?? current.fuelPercent),
  };
}

export function serializePlannerDraft(draft: PlannerDraft): string {
  return JSON.stringify({
    origin: pointOrNull(draft.origin),
    destination: pointOrNull(draft.destination),
    via: pointOrNull(draft.via),
    corridorId: draft.corridorId,
    preferences: draft.preferences,
    departLocal: draft.departLocal,
    fuelPercent: draft.fuelPercent,
  });
}

export function parsePlannerDraft(raw: string | null): PlannerDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const row = parsed as Record<string, unknown>;
    if (!("origin" in row) || !("destination" in row) || !("preferences" in row)) {
      return null;
    }
    const origin = optionalPoint(row.origin);
    const destination = optionalPoint(row.destination);
    const via = optionalPoint(row.via);
    if (origin === undefined || destination === undefined || via === undefined) {
      return null;
    }
    const departLocal =
      typeof row.departLocal === "string" && DEPART_LOCAL.test(row.departLocal)
        ? row.departLocal
        : "";
    return {
      origin,
      destination,
      via,
      corridorId: typeof row.corridorId === "string" ? row.corridorId : null,
      preferences: resolveTripPreferences(row.preferences),
      departLocal,
      fuelPercent: clampFuel(row.fuelPercent),
    };
  } catch {
    return null;
  }
}

export function readPlannerDraft(storage: DraftStorage): PlannerDraft | null {
  try {
    return parsePlannerDraft(storage.getItem(PLANNER_DRAFT_KEY));
  } catch {
    return null;
  }
}

export function writePlannerDraft(storage: DraftStorage, draft: PlannerDraft): void {
  storage.setItem(PLANNER_DRAFT_KEY, serializePlannerDraft(draft));
}

export function clearPlannerDraft(storage: DraftStorage): void {
  storage.removeItem(PLANNER_DRAFT_KEY);
}

function optionalPoint(value: unknown): RoutePoint | null | undefined {
  if (value == null) return null;
  const point = pointOrNull(value);
  return point ?? undefined;
}

function pointOrNull(value: unknown): RoutePoint | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const coords = row.coords;
  if (!coords || typeof coords !== "object") return null;
  const pair = coords as Record<string, unknown>;
  if (typeof pair.lng !== "number" || typeof pair.lat !== "number") return null;
  if (typeof row.id !== "string" || typeof row.label !== "string") return null;
  if (!SOURCES.has(row.source as RoutePoint["source"])) return null;
  const point: RoutePoint = {
    id: row.id,
    label: row.label,
    coords: { lng: pair.lng, lat: pair.lat },
    source: row.source as RoutePoint["source"],
  };
  if (typeof row.subtitle === "string") point.subtitle = row.subtitle;
  if (typeof row.countryCode === "string") point.countryCode = row.countryCode;
  return point;
}

function clampFuel(value: unknown): number {
  const number = typeof value === "number" ? value : 80;
  if (!Number.isFinite(number)) return 80;
  return Math.min(100, Math.max(10, Math.round(number)));
}
