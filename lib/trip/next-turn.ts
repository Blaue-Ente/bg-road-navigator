import { distanceToPolylineKm } from "@/lib/planner/line";
import type { RouteManeuver } from "@/types/route.types";

export interface TurnPoint {
  maneuver: RouteManeuver;
  /** Road kilometres from the start where the turn happens. */
  atKm: number;
}

/** Types that do not need a driver's attention. */
const QUIET = new Set(["continue", "new name", "depart", "notification"]);

/**
 * Places every maneuver on the route once, so each position update is a cheap
 * lookup. `scale` turns line kilometres into road kilometres.
 */
export function placeManeuvers(
  maneuvers: RouteManeuver[],
  line: Array<[number, number]>,
  scale: number
): TurnPoint[] {
  if (line.length < 2) return [];
  return maneuvers
    .filter((maneuver) => !QUIET.has(maneuver.type))
    .map((maneuver) => ({
      maneuver,
      atKm: distanceToPolylineKm(line, maneuver.coords).alongKm * scale,
    }))
    .sort((a, b) => a.atKm - b.atKm);
}

/** The next turn ahead of `alongKm`, and how far away it is. */
export function nextTurn(
  turns: TurnPoint[],
  alongKm: number
): { turn: TurnPoint; distanceM: number } | null {
  const ahead = turns.find((turn) => turn.atKm > alongKm + 0.02);
  if (!ahead) return null;
  return { turn: ahead, distanceM: Math.round((ahead.atKm - alongKm) * 1000) };
}

export type TurnArrow =
  | "left"
  | "right"
  | "straight"
  | "uturn"
  | "roundabout"
  | "arrive";

export function turnArrow(maneuver: RouteManeuver): TurnArrow {
  const type = maneuver.type;
  const modifier = maneuver.modifier ?? "";
  if (type === "arrive") return "arrive";
  if (type === "roundabout" || type === "rotary" || type === "exit roundabout") {
    return "roundabout";
  }
  if (modifier === "uturn") return "uturn";
  if (modifier.includes("left")) return "left";
  if (modifier.includes("right")) return "right";
  return "straight";
}
