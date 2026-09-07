import type { GeoPoint, RouteManeuver } from "@/types/route.types";

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

const TYPE_BG: Record<string, string> = {
  depart: "Тръгнете",
  arrive: "Пристигане",
  turn: "Завийте",
  "new name": "Продължете",
  continue: "Продължете",
  merge: "Влейте се",
  "on ramp": "Влезте на пътя",
  "off ramp": "Излезте",
  fork: "Разклонение",
  "end of road": "В края на пътя завийте",
  roundabout: "Кръгово",
  rotary: "Кръгово",
  "exit roundabout": "Излезте от кръговото",
  "exit rotary": "Излезте от кръговото",
  "roundabout turn": "В кръговото завийте",
  notification: "Внимание",
};

const MOD_BG: Record<string, string> = {
  left: "наляво",
  right: "надясно",
  straight: "напред",
  uturn: "обратен завой",
  "slight left": "леко наляво",
  "slight right": "леко надясно",
  "sharp left": "остро наляво",
  "sharp right": "остро надясно",
};

export function maneuverInstructionBg(step: OsrmStep): string {
  const type = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier;
  const street = step.name?.trim();
  const head = TYPE_BG[type] ?? "Продължете";
  const dir = modifier ? (MOD_BG[modifier] ?? modifier) : "";
  const exit =
    typeof step.maneuver?.exit === "number"
      ? ` (изход ${step.maneuver.exit})`
      : "";
  const onto = street ? ` по ${street}` : "";
  return `${head}${dir ? ` ${dir}` : ""}${exit}${onto}`.trim();
}

export function stepsToManeuvers(
  steps: OsrmStep[] | undefined
): RouteManeuver[] {
  if (!steps?.length) return [];
  const result: RouteManeuver[] = [];
  for (const step of steps) {
    const loc = step.maneuver?.location;
    if (!loc || loc.length < 2) continue;
    const coords: GeoPoint = { lng: loc[0]!, lat: loc[1]! };
    result.push({
      instruction_bg: maneuverInstructionBg(step),
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
