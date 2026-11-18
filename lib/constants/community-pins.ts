import type { CommunityPinCategory } from "@/types/community.types";
import type { PoiIcon } from "@/lib/map/poi-icons";
import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";

/** Single source of truth for community pin categories (DB + API + UI). */
export const COMMUNITY_PIN_CATEGORIES: Array<{
  id: CommunityPinCategory;
  color: string;
  glyph: string;
  shortLivedHours: number | null;
}> = [
  { id: "traffic_jam", color: "#C2410C", glyph: "J", shortLivedHours: 3 },
  { id: "accident", color: "#B91C1C", glyph: "A", shortLivedHours: 6 },
  { id: "border_queue", color: "#1D4ED8", glyph: "B", shortLivedHours: 4 },
  { id: "rest_stop", color: "#047857", glyph: "R", shortLivedHours: null },
  { id: "shortcut", color: "#0F766E", glyph: "Sc", shortLivedHours: null },
  { id: "hotel", color: "#6D28D9", glyph: "H", shortLivedHours: null },
  { id: "place_to_visit", color: "#7C3AED", glyph: "P", shortLivedHours: null },
  { id: "police", color: "#1E3A8A", glyph: "Po", shortLivedHours: 8 },
  { id: "road_works", color: "#B45309", glyph: "W", shortLivedHours: 72 },
  { id: "bad_road", color: "#A16207", glyph: "!", shortLivedHours: 24 * 30 },
  { id: "other", color: "#334155", glyph: "·", shortLivedHours: null },
];

/** Pictogram for each category on the map. */
export const COMMUNITY_PIN_ICONS: Record<CommunityPinCategory, PoiIcon> = {
  traffic_jam: "car",
  accident: "alert",
  border_queue: "border",
  rest_stop: "rest",
  shortcut: "shortcut",
  hotel: "bed",
  place_to_visit: "pin",
  police: "shield",
  road_works: "cone",
  bad_road: "alert",
  other: "info",
};

export const COMMUNITY_PIN_CATEGORY_IDS = COMMUNITY_PIN_CATEGORIES.map(
  (c) => c.id
) as [CommunityPinCategory, ...CommunityPinCategory[]];

function pinCategoryKey(
  category: string
): keyof ReturnType<typeof catalog>["pinCategories"] {
  if (
    category === "traffic_jam" ||
    category === "accident" ||
    category === "border_queue" ||
    category === "rest_stop" ||
    category === "shortcut" ||
    category === "hotel" ||
    category === "place_to_visit" ||
    category === "police" ||
    category === "road_works" ||
    category === "bad_road" ||
    category === "other"
  ) {
    return category;
  }
  return "other";
}

export function communityPinLabel(category: string, locale: Locale = "bg"): string {
  return catalog(locale).pinCategories[pinCategoryKey(category)];
}

export function communityPinColor(category: string): string {
  return (
    COMMUNITY_PIN_CATEGORIES.find((c) => c.id === category)?.color ?? "#334155"
  );
}

export function communityPinGlyph(category: string): string {
  return COMMUNITY_PIN_CATEGORIES.find((c) => c.id === category)?.glyph ?? "·";
}

export function shortLivedHours(category: string): number | null {
  return (
    COMMUNITY_PIN_CATEGORIES.find((c) => c.id === category)?.shortLivedHours ??
    null
  );
}

export function isShortLivedPin(category: string): boolean {
  return shortLivedHours(category) != null;
}

/** Human-readable remaining time until pin expiry. */
export function formatPinExpiry(
  expiresAt: string | null | undefined,
  locale: Locale = "bg"
): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  const t = catalog(locale).pinTime;
  if (ms <= 0) return t.expired;
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours < 24) return formatTemplate(t.remainingHours, { hours: String(hours) });
  const days = Math.ceil(hours / 24);
  return formatTemplate(t.remainingDays, { days: String(days) });
}

/** Age of a report, e.g. "12 min ago". */
export function formatPinAge(
  createdAt: string | null | undefined,
  locale: Locale = "bg"
): string {
  if (!createdAt) return "";
  const ms = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(ms) || ms < 60_000) return catalog(locale).pinTime.justNow;
  const t = catalog(locale).pinTime;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return formatTemplate(t.ageMinutes, { minutes: String(minutes) });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return formatTemplate(t.ageHours, { hours: String(hours) });
  const days = Math.round(hours / 24);
  return formatTemplate(t.ageDays, { days: String(days) });
}