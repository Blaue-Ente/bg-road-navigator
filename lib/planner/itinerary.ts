import { haversineKm } from "@/lib/geo/haversine";
import { BG_UNITS, type DurationUnits } from "@/lib/i18n/units";
import type { PlanStop, TripPlannerResult, WhyReason } from "@/lib/planner/types";
import type { MapStop } from "@/lib/utils/maps-handoff";

export { BG_UNITS, type DurationUnits };

export interface LabeledPoint {
  label: string;
  lng: number;
  lat: number;
}

/** 0 at the first vertex, 1 at the last. Off-line points use the nearest segment projection. */
export function fractionAlongLine(
  line: Array<[number, number]>,
  point: { lng: number; lat: number }
): number {
  if (line.length < 2) return 0;
  const originLng = line[0]![0];
  const originLat = line[0]![1];
  const lat0 = (originLat * Math.PI) / 180;
  const xy = (lng: number, lat: number) => ({
    x: (lng - originLng) * Math.cos(lat0),
    y: lat - originLat,
  });
  const target = xy(point.lng, point.lat);
  let total = 0;
  let bestDist = Infinity;
  let bestAlong = 0;
  let cursor = 0;
  for (let index = 1; index < line.length; index += 1) {
    const a = xy(line[index - 1]![0], line[index - 1]![1]);
    const b = xy(line[index]![0], line[index]![1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    let t = 0;
    if (len > 0) {
      t = ((target.x - a.x) * dx + (target.y - a.y) * dy) / (len * len);
      if (t < 0) t = 0;
      if (t > 1) t = 1;
    }
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    const dist = Math.hypot(target.x - px, target.y - py);
    const along = cursor + len * t;
    if (dist < bestDist) {
      bestDist = dist;
      bestAlong = along;
    }
    cursor += len;
    total += len;
  }
  if (total === 0) return 0;
  return bestAlong / total;
}

export function buildItineraryPoints(input: {
  plan: TripPlannerResult;
  includedStopIds: ReadonlySet<string>;
  via: LabeledPoint[];
}): MapStop[] {
  const line = input.plan.route.geometry.coordinates as Array<[number, number]>;
  const middle: Array<MapStop & { at: number }> = [];
  for (const via of input.via) {
    middle.push({
      label: via.label,
      lng: via.lng,
      lat: via.lat,
      at: fractionAlongLine(line, via),
    });
  }
  const border = input.plan.route.border_waypoint;
  if (border) {
    middle.push({
      label: border.label,
      lng: border.lng,
      lat: border.lat,
      at: fractionAlongLine(line, border),
    });
  }
  for (const stop of input.plan.stops) {
    if (!input.includedStopIds.has(stop.id)) continue;
    middle.push({
      label: stop.place_name ?? stop.title,
      lng: stop.coords.lng,
      lat: stop.coords.lat,
      at: fractionAlongLine(line, stop.coords),
    });
  }
  middle.sort(
    (a, b) => a.at - b.at || (a.label ?? "").localeCompare(b.label ?? "", "bg")
  );
  return [
    pointFrom(input.plan.route.origin),
    ...middle.map(({ label, lng, lat }) => ({ label, lng, lat })),
    pointFrom(input.plan.route.destination),
  ];
}

function pointFrom(point: { label: string; lng: number; lat: number }): MapStop {
  return { label: point.label, lng: point.lng, lat: point.lat };
}

export function checklistStorageKey(
  plan: Pick<TripPlannerResult, "depart_at" | "route">
): string {
  return [
    "bg-road-checklist",
    plan.route.origin.label,
    plan.route.destination.label,
    plan.depart_at.slice(0, 16),
  ].join("|");
}

/** Hours and minutes, including the day, so a border wait stays visible. */
export function formatClockDuration(
  minutes: number,
  units: DurationUnits = BG_UNITS
): string {
  const total = Math.max(0, Math.round(minutes));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${units.day}`);
  if (hours > 0) parts.push(`${hours} ${units.hour}`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins} ${units.min}`);
  return parts.join(" ");
}

export function whySummary(reasons: WhyReason[]): string {
  return reasons
    .map((reason) => reason.detail.trim())
    .filter(Boolean)
    .join(" ");
}

export function defaultIncludedStops(stops: PlanStop[]): Record<string, boolean> {
  const included: Record<string, boolean> = {};
  for (const stop of stops) included[stop.id] = !stop.optional;
  return included;
}

/** Straight-line kilometres, used when a stop has no detour figure. */
export function offsetKm(
  routePoint: { lng: number; lat: number },
  stop: { lng: number; lat: number }
): number {
  return Math.round(haversineKm(routePoint, stop) * 10) / 10;
}
