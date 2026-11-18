import type { TripPreferences } from "@/lib/planner/preferences";

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Values the plan form is allowed to send. Drops a preferred border from the avoid list. */
export function normalizePlannerPreferences(
  prefs: TripPreferences,
  departAt: string | null
): TripPreferences {
  const preferred = prefs.preferred_border?.trim() || null;
  const ages = prefs.with_children
    ? prefs.children_ages
        .filter((age) => Number.isInteger(age) && age >= 0 && age <= 17)
        .slice(0, 8)
    : [];
  return {
    ...prefs,
    fuel_stop: prefs.fuel_stop === "on_route" ? "on_route" : "detour",
    max_detour_min: Math.round(clamp(prefs.max_detour_min, 0, 45)),
    break_every_min: Math.round(clamp(prefs.break_every_min, 45, 240)),
    break_exact: prefs.break_exact === true,
    max_driving_hours: Math.round(clamp(prefs.max_driving_hours, 4, 14) * 2) / 2,
    drivers: Math.round(clamp(prefs.drivers, 1, 4)),
    adults: Math.round(clamp(prefs.adults ?? 1, 1, 8)),
    night_mode: prefs.night_mode === "swap" && prefs.drivers >= 2 ? "swap" : "sleep",
    car_comfort:
      prefs.car_comfort === "roomy" || prefs.car_comfort === "compact"
        ? prefs.car_comfort
        : "standard",
    pace: prefs.pace === "scenic" ? "scenic" : "fast",
    children_ages: ages,
    with_children: prefs.with_children,
    avoid_borders: prefs.avoid_borders
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && id !== preferred)
      .slice(0, 12),
    preferred_border: preferred,
    depart_at: departAt,
  };
}

export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
