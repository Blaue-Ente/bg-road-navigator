import type { ResolvedVehicle } from "@/lib/planner/vehicle";

export interface FuelWindow {
  index: number;
  /** Distance where the reserve would be reached if you do not stop. */
  mustStopKm: number;
  windowStartKm: number;
  windowEndKm: number;
}

export interface FuelWindowOptions {
  /** How wide the "stop somewhere in here" band is, before the reserve. */
  windowKm?: number;
  /** Do not plan a stop this close to the destination. */
  destinationSlackKm?: number;
}

const MAX_WINDOWS = 8;

/**
 * Where the tank or battery hits the reserve, and the band to look for a station.
 * A stop is assumed to refill to full, then the next window is measured from there.
 */
export function fuelWindows(
  distanceKm: number,
  vehicle: ResolvedVehicle,
  options: FuelWindowOptions = {}
): FuelWindow[] {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return [];
  const windowKm = Math.max(10, options.windowKm ?? 40);
  const slack = Math.max(0, options.destinationSlackKm ?? 15);
  const kmPerFull =
    (vehicle.capacity * 100) / Math.max(vehicle.consumption_per_100, 0.1);

  const windows: FuelWindow[] = [];
  let cursorKm = 0;
  let level = vehicle.level;

  while (windows.length < MAX_WINDOWS) {
    const usable = level - vehicle.reserve;
    const reachKm = usable <= 0 ? 0 : usable * kmPerFull;
    const mustStopKm = cursorKm + reachKm;
    if (mustStopKm >= distanceKm - slack) break;

    const windowEndKm = Math.max(cursorKm, mustStopKm);
    const windowStartKm =
      mustStopKm <= 0 ? 0 : Math.max(cursorKm, mustStopKm - windowKm);

    windows.push({
      index: windows.length,
      mustStopKm: roundKm(windowEndKm),
      windowStartKm: roundKm(windowStartKm),
      windowEndKm: roundKm(Math.min(distanceKm, windowEndKm)),
    });

    cursorKm = windowEndKm;
    level = 1;
    if (cursorKm >= distanceKm - slack) break;
  }

  return windows;
}

function roundKm(value: number): number {
  return Math.round(value * 10) / 10;
}
