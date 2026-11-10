import type { CommunityPinCategory } from "@/types/community.types";

/** Single source of truth for community pin categories (DB + API + UI). */
export const COMMUNITY_PIN_CATEGORIES: Array<{
  id: CommunityPinCategory;
  label: string;
  color: string;
  glyph: string;
  shortLivedHours: number | null;
}> = [
  { id: "traffic_jam", label: "Задръстване", color: "#C2410C", glyph: "З", shortLivedHours: 3 },
  { id: "accident", label: "Катастрофа", color: "#B91C1C", glyph: "К", shortLivedHours: 6 },
  { id: "border_queue", label: "Опашка на граница", color: "#1D4ED8", glyph: "Г", shortLivedHours: 4 },
  { id: "rest_stop", label: "Място за почивка", color: "#047857", glyph: "П", shortLivedHours: null },
  { id: "shortcut", label: "Пряк път", color: "#0F766E", glyph: "Пт", shortLivedHours: null },
  { id: "hotel", label: "Хубав хотел", color: "#6D28D9", glyph: "Х", shortLivedHours: null },
  { id: "place_to_visit", label: "Място за виждане", color: "#7C3AED", glyph: "М", shortLivedHours: null },
  { id: "police", label: "Полиция", color: "#1E3A8A", glyph: "По", shortLivedHours: 8 },
  { id: "road_works", label: "Ремонт", color: "#B45309", glyph: "Р", shortLivedHours: 72 },
  { id: "other", label: "Друго", color: "#334155", glyph: "·", shortLivedHours: null },
];

export const COMMUNITY_PIN_CATEGORY_IDS = COMMUNITY_PIN_CATEGORIES.map(
  (c) => c.id
) as [CommunityPinCategory, ...CommunityPinCategory[]];

export function communityPinLabel(category: string): string {
  return (
    COMMUNITY_PIN_CATEGORIES.find((c) => c.id === category)?.label ?? category
  );
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
  expiresAt: string | null | undefined
): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "изтекъл";
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours < 24) return `още ~${hours} ч`;
  const days = Math.ceil(hours / 24);
  return `още ~${days} д`;
}

/** Age of a report, e.g. "преди 12 мин". */
export function formatPinAge(createdAt: string | null | undefined): string {
  if (!createdAt) return "";
  const ms = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(ms) || ms < 60_000) return "току-що";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `преди ${minutes} мин`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `преди ${hours} ч`;
  const days = Math.round(hours / 24);
  return `преди ${days} д`;
}
