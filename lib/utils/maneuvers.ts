import type { GeoPoint, RouteManeuver } from "@/types/route.types";
import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";

interface OsrmStep {
  name?: string;
  distance?: number;
  duration?: number;
  maneuver?: {
    type?: string;
    modifier?: string;
    location?: [number, number];
    exit?: number;
  };
}

export function maneuverInstruction(
  step: OsrmStep,
  locale: Locale = "bg"
): string {
  const m = catalog(locale).maneuvers;
  const type = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier;
  const street = step.name?.trim();
  const types = m.types as Record<string, string>;
  const mods = m.modifiers as Record<string, string>;
  const head = types[type] ?? types.continue;
  const dir = modifier ? (mods[modifier] ?? modifier) : "";
  const exit =
    typeof step.maneuver?.exit === "number"
      ? formatTemplate(m.exitNumber, { exit: String(step.maneuver.exit) })
      : "";
  const onto = street
    ? formatTemplate(m.ontoStreet, { street })
    : "";
  return `${head}${dir ? ` ${dir}` : ""}${exit}${onto}`.trim();
}

/** @deprecated Use `maneuverInstruction(step, "bg")` */
export function maneuverInstructionBg(step: OsrmStep): string {
  return maneuverInstruction(step, "bg");
}

export function stepsToManeuvers(
  steps: OsrmStep[] | undefined,
  locale: Locale = "bg"
): RouteManeuver[] {
  if (!steps?.length) return [];
  const result: RouteManeuver[] = [];
  for (const step of steps) {
    const loc = step.maneuver?.location;
    if (!loc || loc.length < 2) continue;
    const coords: GeoPoint = { lng: loc[0]!, lat: loc[1]! };
    result.push({
      instruction_bg: maneuverInstruction(step, locale),
      type: step.maneuver?.type ?? "continue",
      modifier: step.maneuver?.modifier,
      street: step.name || undefined,
      distance_m: Math.round(step.distance ?? 0),
      duration_s: Math.round(step.duration ?? 0),
      coords,
    });
    if (result.length >= 80) break;
  }
  return result;
}