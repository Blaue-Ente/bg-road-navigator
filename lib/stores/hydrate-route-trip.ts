import {
  readRouteTripSession,
  tripSessionStorage,
} from "@/lib/stores/route-trip-session";
import { useRouteStore } from "@/lib/stores/route.store";

/** Restore the last successful trip after a hard navigation when zustand was wiped. */
export function hydrateRouteTripIntoStore(): boolean {
  const state = useRouteStore.getState();
  if (state.activeRoute || state.tripPlan) return false;
  const storage = tripSessionStorage();
  if (!storage) return false;
  const payload = readRouteTripSession(storage);
  if (!payload?.activeRoute) return false;
  useRouteStore.setState({
    tripPlan: payload.tripPlan,
    activeRoute: payload.activeRoute,
    alternativeRoutes: payload.alternativeRoutes ?? [],
    planningVia: payload.planningVia,
    planDetailOpen: payload.planDetailOpen,
    routeStatus: "success",
    routeError: null,
  });
  return true;
}