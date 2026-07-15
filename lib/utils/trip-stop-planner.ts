import { EUROPEAN_REST_AREAS, type RestArea } from "@/lib/constants/rest-areas";
import type { GeoPoint, Route } from "@/types/route.types";
import type {
  TripPlan,
  TripPlanStop,
  TripPlannerPreferences,
} from "@/types/trip.types";

const DEFAULT_BREAK_MIN = 210;
const DEFAULT_OVERNIGHT_MIN = 600;
const DEFAULT_FUEL_RANGE_KM = 550;
const DEFAULT_EV_RANGE_KM = 260;
const REST_AREA_SEARCH_RADIUS_KM = 45;

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const radius = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getRoutePointAtDistance(route: Route, targetKm: number): GeoPoint {
  const coordinates = route.geometry.coordinates;
  if (coordinates.length === 0) return route.destination.coords;

  let travelledKm = 0;
  const target = Math.min(targetKm, route.distance_km);

  for (let index = 1; index < coordinates.length; index++) {
    const previous = {
      lng: coordinates[index - 1]![0],
      lat: coordinates[index - 1]![1],
    };
    const current = {
      lng: coordinates[index]![0],
      lat: coordinates[index]![1],
    };
    const segmentKm = haversineKm(previous, current);

    if (travelledKm + segmentKm >= target) {
      const ratio = segmentKm === 0 ? 0 : (target - travelledKm) / segmentKm;
      return {
        lng: previous.lng + (current.lng - previous.lng) * ratio,
        lat: previous.lat + (current.lat - previous.lat) * ratio,
      };
    }
    travelledKm += segmentKm;
  }

  return route.destination.coords;
}

function nearestRestArea(routePoint: GeoPoint): RestArea | null {
  let nearest: { area: RestArea; distanceKm: number } | null = null;

  for (const area of EUROPEAN_REST_AREAS) {
    const distanceKm = haversineKm(routePoint, area.coords);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { area, distanceKm };
    }
  }

  return nearest && nearest.distanceKm <= REST_AREA_SEARCH_RADIUS_KM
    ? nearest.area
    : null;
}

function stopAt(
  route: Route,
  type: TripPlanStop["type"],
  targetMin: number,
  title: string,
  description: string,
  source: TripPlanStop["source"] = "calculation"
): TripPlanStop {
  const distanceFromStartKm = Math.min(
    route.distance_km,
    Math.round((targetMin / route.duration_min) * route.distance_km)
  );
  const point = getRoutePointAtDistance(route, distanceFromStartKm);

  return {
    id: `${type}-${targetMin}`,
    type,
    title,
    description,
    distance_from_start_km: distanceFromStartKm,
    estimated_arrival_min: targetMin,
    coords: point,
    source,
    requires_confirmation: true,
  };
}

function addRestAndOvernightStops(
  route: Route,
  breakEveryMin: number,
  overnightAfterMin: number
): TripPlanStop[] {
  const stops: TripPlanStop[] = [];

  for (let minute = breakEveryMin; minute < route.duration_min; minute += breakEveryMin) {
    const isOvernight = minute % overnightAfterMin < breakEveryMin;
    const type = isOvernight ? "overnight" : "rest";
    const generic = stopAt(
      route,
      type,
      minute,
      isOvernight ? "Нощувка" : "Почивка",
      isOvernight
        ? "Планирайте нощувка преди следващия дълъг етап."
        : "Направете пауза за вода, храна и разтягане."
    );
    const area = nearestRestArea(generic.coords);

    if (area) {
      stops.push({
        ...generic,
        title: isOvernight ? `Нощувка близо до ${area.name}` : area.name,
        description: `${area.location} · ${area.facilities.join(", ")}`,
        coords: area.coords,
        source: "curated_rest_area",
        booking_url: isOvernight
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${area.name} ${area.location}`
            )}`
          : undefined,
      });
    } else {
      stops.push(generic);
    }
  }

  return stops;
}

function addEnergyStops(
  route: Route,
  preferences: TripPlannerPreferences
): TripPlanStop[] {
  const isEv = preferences.vehicle_type === "ev";
  const rangeKm = isEv
    ? preferences.ev_range_km ?? DEFAULT_EV_RANGE_KM
    : preferences.fuel_range_km ?? DEFAULT_FUEL_RANGE_KM;
  const safetyRangeKm = Math.max(80, Math.round(rangeKm * 0.8));
  const stops: TripPlanStop[] = [];

  for (let km = safetyRangeKm; km < route.distance_km; km += safetyRangeKm) {
    const targetMin = Math.round((km / route.distance_km) * route.duration_min);
    stops.push(
      stopAt(
        route,
        isEv ? "ev_charge" : "fuel",
        targetMin,
        isEv ? "Зареждане на EV" : "Зареждане с гориво",
        isEv
          ? "Изберете потвърдена зарядна станция и проверете наличност преди тръгване."
          : "Изберете бензиностанция по маршрута и проверете цената на място."
      )
    );
  }

  return stops;
}

export function buildTripPlan(
  route: Route,
  preferences: TripPlannerPreferences
): TripPlan {
  const breakEveryMin = Math.max(
    120,
    preferences.break_every_min ?? DEFAULT_BREAK_MIN
  );
  const overnightAfterMin = Math.max(
    480,
    preferences.overnight_after_min ?? DEFAULT_OVERNIGHT_MIN
  );
  const stops = [
    ...addEnergyStops(route, preferences),
    ...addRestAndOvernightStops(route, breakEveryMin, overnightAfterMin),
  ].sort((a, b) => a.distance_from_start_km - b.distance_from_start_km);

  const warnings: string[] = [];
  if (route.duration_min >= overnightAfterMin) {
    warnings.push(
      "Маршрутът е дълъг. Потвърдете поне една нощувка преди тръгване."
    );
  }
  if (preferences.vehicle_type === "ev") {
    warnings.push(
      "Наличността на EV зарядните не е гарантирана — потвърдете всяка спирка с оператора."
    );
  }
  if (stops.some((stop) => stop.source === "calculation")) {
    warnings.push(
      "Част от спирките са изчислени ориентири. Изберете конкретен обект преди пътуването."
    );
  }

  return {
    generated_at: new Date().toISOString(),
    assumptions: {
      driving_break_every_min: breakEveryMin,
      overnight_after_min: overnightAfterMin,
      fuel_range_km:
        preferences.vehicle_type === "ev"
          ? undefined
          : preferences.fuel_range_km ?? DEFAULT_FUEL_RANGE_KM,
      ev_range_km:
        preferences.vehicle_type === "ev"
          ? preferences.ev_range_km ?? DEFAULT_EV_RANGE_KM
          : undefined,
    },
    stops,
    warnings,
  };
}
