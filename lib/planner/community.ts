import { distanceToPolylineKm } from "@/lib/planner/line";
import { formatTemplate } from "@/lib/i18n/format-template";
import { catalog, type Locale } from "@/lib/i18n/locale";
import type { CommunityNote } from "@/lib/planner/types";
import type { CommunityPin } from "@/types/community.types";

const NEAR_ROUTE_KM = 18;

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
    if (approach.distanceKm > NEAR_ROUTE_KM) continue;
    const penalty = PENALTY_MIN[pin.category] ?? 0;
    notes.push({
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
