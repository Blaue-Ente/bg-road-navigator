import { haversineKm } from "@/lib/geo/haversine";
import { distanceToPolylineKm } from "@/lib/planner/line";
import type { GeoPoint } from "@/types/route.types";

export type PlaceClass = "off_exit" | "motorway_service" | "other";

export interface RankedPlace {
  lat: number;
  lng: number;
  motorwayService: boolean;
  priceAmount: number | null;
}

export interface ClassifiedPlace<T> {
  place: T;
  placeClass: PlaceClass;
  distanceToRouteKm: number;
  distanceToAnchorKm: number;
}

/**
 * Off-motorway stations within 3 km are preferred to service areas on the road.
 * A known price breaks ties inside the same class. Prices are never invented here.
 */
export function classifyPlace(
  distanceToRouteKm: number,
  motorwayService: boolean
): PlaceClass {
  if (motorwayService || distanceToRouteKm < 0.4) return "motorway_service";
  if (distanceToRouteKm <= 3) return "off_exit";
  return "other";
}

export function chooseStation<T extends RankedPlace>(
  places: T[],
  route: Array<[number, number]>,
  anchor: GeoPoint
): ClassifiedPlace<T> | null {
  const classified = places
    .map((place) => {
      const along = distanceToPolylineKm(route, {
        lng: place.lng,
        lat: place.lat,
      });
      return {
        place,
        placeClass: classifyPlace(along.distanceKm, place.motorwayService),
        distanceToRouteKm: along.distanceKm,
        distanceToAnchorKm: haversineKm(anchor, {
          lng: place.lng,
          lat: place.lat,
        }),
      };
    })
    .filter(
      (item) => item.distanceToAnchorKm <= 45 && item.distanceToRouteKm <= 6
    );
  classified.sort(comparePlaces);
  return classified[0] ?? null;
}

const CLASS_RANK: Record<PlaceClass, number> = {
  off_exit: 0,
  motorway_service: 1,
  other: 2,
};

function comparePlaces<T extends RankedPlace>(
  a: ClassifiedPlace<T>,
  b: ClassifiedPlace<T>
): number {
  const byClass = CLASS_RANK[a.placeClass] - CLASS_RANK[b.placeClass];
  if (byClass !== 0) return byClass;
  const aPriced = a.place.priceAmount == null ? 1 : 0;
  const bPriced = b.place.priceAmount == null ? 1 : 0;
  if (aPriced !== bPriced) return aPriced - bPriced;
  return a.distanceToAnchorKm - b.distanceToAnchorKm;
}
