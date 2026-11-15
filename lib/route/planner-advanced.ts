import {
  DEFAULT_TRIP_PREFERENCES,
  type TripPreferences,
} from "@/lib/planner/preferences";
import { proposedDepartLocalValue } from "@/lib/planner/proposed-depart";
import type { RoutePoint } from "@/types/route.types";

const DEFAULT_FUEL_PERCENT = 80;

function preferencesDiffer(prefs: TripPreferences): boolean {
  const d = DEFAULT_TRIP_PREFERENCES;
  return (
    prefs.fuel_stop !== d.fuel_stop ||
    prefs.max_detour_min !== d.max_detour_min ||
    prefs.break_every_min !== d.break_every_min ||
    prefs.with_pet !== d.with_pet ||
    prefs.avoid_motorways !== d.avoid_motorways ||
    prefs.avoid_tolls !== d.avoid_tolls ||
    prefs.overnight !== d.overnight ||
    prefs.max_driving_hours !== d.max_driving_hours ||
    prefs.pace !== d.pace ||
    prefs.with_children !== d.with_children ||
    prefs.children_ages.length > 0 ||
    prefs.drivers !== d.drivers ||
    prefs.avoid_borders.length > 0 ||
    prefs.preferred_border !== d.preferred_border
  );
}

/** True when any field hidden under «Още опции» differs from the shipped defaults. */
export function hasAdvancedPlannerOptions(input: {
  via: RoutePoint | null;
  fuelPercent: number;
  departLocal: string;
  preferences: TripPreferences;
  proposedDepart?: string;
}): boolean {
  const proposed = input.proposedDepart ?? proposedDepartLocalValue();
  if (input.via) return true;
  if (input.fuelPercent !== DEFAULT_FUEL_PERCENT) return true;
  if (input.departLocal && input.departLocal !== proposed) return true;
  return preferencesDiffer(input.preferences);
}