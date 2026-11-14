/**
 * Vignettes and distance tolls for the countries a route actually crosses.
 * Pure: an AI planner can call this later without a network round-trip.
 */

import { countriesAlongRoute } from "@/lib/geo/countries-along-route";
import {
  getVignetteByCountryCode,
  type VignetteLink,
} from "@/lib/constants/vignettes";
import type { GeoPoint, Route } from "@/types/route.types";

export interface RouteTollInput {
  geometry?: Route["geometry"] | null;
  maneuvers?: Array<{ coords: GeoPoint }>;
  origin?: { coords: GeoPoint };
  destination?: { coords: GeoPoint };
}

export function getRouteTolls(route: RouteTollInput): VignetteLink[] {
  const tolls: VignetteLink[] = [];
  for (const code of countriesAlongRoute(route)) {
    const link = getVignetteByCountryCode(code);
    if (link) tolls.push(link);
  }
  return tolls;
}
