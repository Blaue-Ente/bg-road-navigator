export const SIGHT_KINDS = [
  "nature",
  "architecture",
  "history",
  "attraction",
  "zoo",
  "walk",
  "festival",
] as const;

export type SightKind = (typeof SIGHT_KINDS)[number];

/** A place worth a stop, checked against the map and placed on the road. */
export interface PlanSight {
  id: string;
  name: string;
  town: string;
  kind: SightKind;
  lat: number;
  lng: number;
  /** Kilometres along the road where it is closest. */
  along_km: number;
  /** Straight-line distance from the road. */
  off_route_km: number;
  /** Time at the place. */
  visit_min: number;
  /** Extra driving there and back plus the visit. */
  extra_min: number;
  /** Why it is worth a stop, one or two sentences. */
  why: string;
  /** A short story of the place, for the printed plan. */
  history: string;
  /** The plan's planned rest stop it could replace, when one is close. */
  near_rest_km: number | null;
  family_friendly: boolean;
}
