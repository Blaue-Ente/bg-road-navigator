import { distanceToPolylineKm } from "@/lib/planner/line";
import { formatTemplate } from "@/lib/i18n/format-template";
import { catalog, type Locale } from "@/lib/i18n/locale";
import type { CommunityNote } from "@/lib/planner/types";
import type { CommunityPin } from "@/types/community.types";

const NEAR_ROUTE_KM = 18;
/** The ends of a stretch must be this close to the driven line. */
const SEGMENT_NEAR_KM = 6;
/** Slower driving on a bad stretch, minutes lost per kilometre. */
const SEGMENT_MIN_PER_KM = 0.4;
const MAX_SEGMENT_PENALTY_MIN = 20;

const PENALTY_MIN: Partial<Record<CommunityPin["category"], number>> = {
  accident: 12,
  traffic_jam: 8,
  border_queue: 10,
  road_works: 6,
  bad_road: 0,
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
  now = Date.now(),
  locale: Locale = "bg"
): CommunityScore {
  const notes: CommunityNote[] = [];
  for (const pin of pins) {
    const approach = distanceToPolylineKm(coordinates, pin.coords);
    // A bad stretch counts when both its ends are on the road, and then costs
    // time by its length.
    let segment: { from_km: number; to_km: number } | null = null;
    let penalty = PENALTY_MIN[pin.category] ?? 0;
    if (pin.category === "bad_road" && pin.end_coords) {
      const end = distanceToPolylineKm(coordinates, pin.end_coords);
      if (approach.distanceKm > SEGMENT_NEAR_KM || end.distanceKm > SEGMENT_NEAR_KM) continue;
      const from = Math.min(approach.alongKm, end.alongKm);
      const to = Math.max(approach.alongKm, end.alongKm);
      segment = { from_km: Math.round(from), to_km: Math.round(to) };
      penalty = Math.min(MAX_SEGMENT_PENALTY_MIN, Math.round((to - from) * SEGMENT_MIN_PER_KM));
    } else if (approach.distanceKm > NEAR_ROUTE_KM) {
      continue;
    }
    notes.push({
      ...(segment ?? {}),
      id: pin.id,
      category: pin.category,
      title: pin.title,
      penalty_min: penalty,
      distance_km: Math.round(approach.distanceKm * 10) / 10,
      age_label:
        formatCommunityPinAge(pin.created_at, locale) ||
        ageFrom(pin.created_at, now, locale),
    });
  }
  notes.sort((a, b) => b.penalty_min - a.penalty_min);
  const raw = notes.reduce((sum, note) => sum + note.penalty_min, 0);
  return {
    penaltyMin: Math.min(30, raw),
    notes: notes.slice(0, 8),
  };
}

export function formatCommunityPinAge(
  createdAt: string | null | undefined,
  locale: Locale = "bg"
): string {
  if (!createdAt) return "";
  const ms = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(ms) || ms < 60_000) {
    return catalog(locale).planner.age.pinJustNow;
  }
  const a = catalog(locale).planner.age;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) {
    return formatTemplate(a.pinMinutes, { minutes: String(minutes) });
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return formatTemplate(a.pinHours, { hours: String(hours) });
  }
  const days = Math.round(hours / 24);
  return formatTemplate(a.pinDays, { days: String(days) });
}

function ageFrom(createdAt: string, now: number, locale: Locale): string {
  const ms = now - new Date(createdAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const a = catalog(locale).planner.age;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) {
    return formatTemplate(a.pinMinutes, { minutes: String(minutes) });
  }
  const hours = Math.round(minutes / 60);
  return formatTemplate(a.pinHours, { hours: String(hours) });
}
