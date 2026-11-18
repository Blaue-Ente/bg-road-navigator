import type { RouteChoice, TripPlannerResult } from "@/lib/planner/types";
import type { TripPreferences } from "@/lib/planner/preferences";
import type { PlanningVia } from "@/lib/stores/route.store";

export interface ReplanTripInput {
  plan: TripPlannerResult;
  via: PlanningVia[];
  routeChoice?: RouteChoice;
}

export async function replanTrip(
  input: ReplanTripInput
): Promise<TripPlannerResult | null> {
  const { plan, via, routeChoice } = input;
  const prefs: TripPreferences = plan.preferences;
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: {
        label: plan.route.origin.label,
        lng: plan.route.origin.lng,
        lat: plan.route.origin.lat,
      },
      destination: {
        label: plan.route.destination.label,
        lng: plan.route.destination.lng,
        lat: plan.route.destination.lat,
      },
      ...(via.length > 0
        ? {
            via: via.slice(0, 3).map((point) => ({
              label: point.label,
              lng: point.lng,
              lat: point.lat,
            })),
          }
        : {}),
      depart_at: plan.depart_at,
      fuel_level: plan.vehicle.level,
      reserve_margin: plan.vehicle.reserve,
      preferences: prefs,
      ...(plan.vehicle.vehicle_id ? { vehicle_id: plan.vehicle.vehicle_id } : {}),
      vehicle: {
        vehicle_type: plan.vehicle.vehicle_type,
        fuel_type: plan.vehicle.fuel_type,
        consumption_per_100: plan.vehicle.consumption_per_100,
      },
      ...(routeChoice ? { route_choice: routeChoice } : {}),
    }),
  });
  if (!response.ok) return null;
  return (await response.json()) as TripPlannerResult;
}