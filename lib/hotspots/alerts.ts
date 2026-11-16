import { alertText } from "@/lib/i18n/hotspot-alerts";
import type { Locale } from "@/lib/i18n/locale";
import { distanceToPolylineKm } from "@/lib/planner/line";

/** Default look-ahead. The settings screen can change it. */
export const DEFAULT_ALERT_AHEAD_M = 1000;

/** Ignore a fix that has left the planned line. */
const MAX_OFF_ROUTE_KM = 2;

export interface AlertTarget {
  id: string;
  lng: number;
  lat: number;
  kind: "hotspot" | "hazard";
}

export interface ProximityAlert {
  id: string;
  kind: "hotspot" | "hazard";
  distanceM: number;
  text: string;
}

type Line = Array<[number, number]>;

/**
 * Targets on the route that are still ahead and inside the look-ahead.
 * A place already passed, or farther than `aheadM` along the line, is quiet.
 */
export function alertsAhead(input: {
  line: Line;
  position: { lng: number; lat: number };
  targets: AlertTarget[];
  aheadM?: number;
  locale?: Locale;
}): ProximityAlert[] {
  const aheadM = input.aheadM ?? DEFAULT_ALERT_AHEAD_M;
  if (input.line.length < 2 || input.targets.length === 0) return [];
  const here = distanceToPolylineKm(input.line, input.position);
  if (here.distanceKm > MAX_OFF_ROUTE_KM) return [];

  const alerts: ProximityAlert[] = [];
  for (const target of input.targets) {
    const place = distanceToPolylineKm(input.line, target);
    if (place.distanceKm > 0.5) continue;
    if (place.alongKm <= 0.02 && !facesForward(input.line, target)) continue;
    const aheadKm = place.alongKm - here.alongKm;
    if (aheadKm < -0.05) continue;
    const distanceM = Math.round(Math.max(0, aheadKm) * 1000);
    if (distanceM > aheadM) continue;
    alerts.push({
      id: target.id,
      kind: target.kind,
      distanceM,
      text: alertText(target.kind, distanceM, input.locale),
    });
  }
  alerts.sort((a, b) => a.distanceM - b.distanceM);
  return alerts;
}

/** A point that snaps to the first vertex can sit behind the departure. */
function facesForward(
  line: Line,
  target: { lng: number; lat: number }
): boolean {
  const start = line[0];
  const next = line[1];
  if (!start || !next) return false;
  const kx = Math.cos((start[1] * Math.PI) / 180);
  const dx = (next[0] - start[0]) * kx;
  const dy = next[1] - start[1];
  const tx = (target.lng - start[0]) * kx;
  const ty = target.lat - start[1];
  return dx * tx + dy * ty >= 0;
}

/** Each id is spoken once. Later calls with the same id return nothing new. */
export function throttleAlerts(
  alerts: ProximityAlert[],
  seen: ReadonlySet<string>
): { fresh: ProximityAlert[]; seen: Set<string> } {
  const next = new Set(seen);
  const fresh: ProximityAlert[] = [];
  for (const alert of alerts) {
    if (next.has(alert.id)) continue;
    next.add(alert.id);
    fresh.push(alert);
  }
  return { fresh, seen: next };
}
