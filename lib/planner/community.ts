import { formatPinAge } from "@/lib/constants/community-pins";
import { distanceToPolylineKm } from "@/lib/planner/line";
import type { CommunityNote } from "@/lib/planner/types";
import type { CommunityPin } from "@/types/community.types";

const NEAR_ROUTE_KM = 18;

const PENALTY_MIN: Partial<Record<CommunityPin["category"], number>> = {
  accident: 12,
  traffic_jam: 8,
  border_queue: 10,
  road_works: 6,
  police: 0,
};

export interface CommunityScore {
  penaltyMin: number;
  notes: CommunityNote[];
}

/** Reports close to the driven line. The penalty is capped so one cluster cannot dominate. */
export function communityAlongRoute(
  coordinates: Array<[number, number]>,
  pins: CommunityPin[],
  now = Date.now()
): CommunityScore {
  const notes: CommunityNote[] = [];
  for (const pin of pins) {
    const approach = distanceToPolylineKm(coordinates, pin.coords);
    if (approach.distanceKm > NEAR_ROUTE_KM) continue;
    const penalty = PENALTY_MIN[pin.category] ?? 0;
    notes.push({
      id: pin.id,
      category: pin.category,
      title: pin.title,
      penalty_min: penalty,
      distance_km: Math.round(approach.distanceKm * 10) / 10,
      age_label: formatPinAge(pin.created_at) || ageFrom(pin.created_at, now),
    });
  }
  notes.sort((a, b) => b.penalty_min - a.penalty_min);
  const raw = notes.reduce((sum, note) => sum + note.penalty_min, 0);
  return {
    penaltyMin: Math.min(30, raw),
    notes: notes.slice(0, 8),
  };
}

function ageFrom(createdAt: string, now: number): string {
  const ms = now - new Date(createdAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `преди ${minutes} мин`;
  return `преди ${Math.round(minutes / 60)} ч`;
}
