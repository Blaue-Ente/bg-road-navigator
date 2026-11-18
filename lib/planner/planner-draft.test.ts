import { describe, expect, it } from "vitest";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import {
  PLANNER_DRAFT_KEY,
  clearPlannerDraft,
  createPlannerDraft,
  parsePlannerDraft,
  patchPlannerDraft,
  readPlannerDraft,
  serializePlannerDraft,
  writePlannerDraft,
  type DraftStorage,
  type PlannerDraft,
} from "@/lib/planner/planner-draft";
import type { RoutePoint } from "@/types/route.types";

function memory(): DraftStorage & { dump(): Map<string, string> } {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
    dump: () => items,
  };
}

function place(id: string, label: string): RoutePoint {
  return {
    id,
    label,
    subtitle: "Германия",
    coords: { lng: 11.5, lat: 48.1 },
    source: "geocoder",
    countryCode: "DE",
  };
}

function filled(): PlannerDraft {
  return createPlannerDraft({
    origin: place("munich", "Мюнхен"),
    destination: place("sofia", "София"),
    via: [place("nis", "Ниш"), place("vidin", "Видин")],
    corridorId: "de-bg",
    preferences: {
      ...DEFAULT_TRIP_PREFERENCES,
      avoid_tolls: true,
      with_pet: true,
      drivers: 2,
    },
    departLocal: "2026-11-20T08:30",
    fuelPercent: 45,
  });
}

describe("planner draft", () => {
  it("restores every field from a fresh read, the way a reload does", () => {
    const storage = memory();
    const draft = filled();
    writePlannerDraft(storage, draft);
    const restored = readPlannerDraft(storage);
    expect(restored).toEqual(draft);
    expect(storage.dump().has(PLANNER_DRAFT_KEY)).toBe(true);
  });

  it("keeps origin, preferences and fuel when the stored payload also names a car", () => {
    const draft = filled();
    const raw = JSON.parse(serializePlannerDraft(draft)) as Record<string, unknown>;
    raw.vehicle = { car: "Golf", fuel_type: "petrol", tank_capacity_liters: 55 };
    const restored = parsePlannerDraft(JSON.stringify(raw));
    expect(restored).toEqual(draft);
    expect(JSON.stringify(restored)).not.toContain("Golf");
  });

  it("patches one field and leaves the rest", () => {
    const draft = filled();
    const next = patchPlannerDraft(draft, { fuelPercent: 30 });
    expect(next.fuelPercent).toBe(30);
    expect(next.origin).toEqual(draft.origin);
    expect(next.destination).toEqual(draft.destination);
    expect(next.via).toEqual(draft.via);
    expect(next.preferences).toEqual(draft.preferences);
    expect(next.departLocal).toBe(draft.departLocal);
    expect(next.corridorId).toBe(draft.corridorId);
  });

  it("drops a corrupt payload and clears after a successful plan or a reset", () => {
    const storage = memory();
    writePlannerDraft(storage, filled());
    expect(parsePlannerDraft("not-json")).toBeNull();
    expect(parsePlannerDraft(JSON.stringify({ fuelPercent: 40 }))).toBeNull();
    clearPlannerDraft(storage);
    expect(readPlannerDraft(storage)).toBeNull();
  });
});

describe("planner draft with several through-points", () => {
  it("keeps up to three, in order", () => {
    const draft = createPlannerDraft({
      via: [place("a", "A"), place("b", "B"), place("c", "C"), place("d", "D")],
    });
    expect(draft.via.map((point) => point.id)).toEqual(["a", "b", "c"]);
  });

  it("reads a draft saved with a single through-point", () => {
    const raw = JSON.stringify({
      origin: null,
      destination: null,
      via: place("nis", "Ниш"),
      preferences: {},
    });
    expect(parsePlannerDraft(raw)?.via.map((point) => point.id)).toEqual(["nis"]);
  });

  it("reads a draft saved with no through-point", () => {
    const raw = JSON.stringify({
      origin: null,
      destination: null,
      via: null,
      preferences: {},
    });
    expect(parsePlannerDraft(raw)?.via).toEqual([]);
  });
});
