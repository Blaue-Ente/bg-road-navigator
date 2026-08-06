import type { CommunityPinCategory } from "@/types/community.types";

/** Single source of truth for community pin categories (DB + API + UI). */
export const COMMUNITY_PIN_CATEGORIES: Array<{
  id: CommunityPinCategory;
  label: string;
  color: string;
}> = [
  { id: "police", label: "Полиция", color: "#E74C3C" },
  { id: "camera", label: "Камера", color: "#9B59B6" },
  { id: "accident", label: "Катастрофа", color: "#E74C3C" },
  { id: "hazard", label: "Опасност", color: "#F39C12" },
  { id: "road_works", label: "Ремонт", color: "#F39C12" },
  { id: "traffic_jam", label: "Задръстване", color: "#E67E22" },
  { id: "fuel_issue", label: "Гориво", color: "#E67E22" },
  { id: "border_info", label: "Граница", color: "#3498DB" },
  { id: "rest_area", label: "Почивка", color: "#27AE60" },
  { id: "overnight", label: "Нощувка", color: "#1ABC9C" },
  { id: "food", label: "Хранене", color: "#F1C40F" },
  { id: "point_of_interest", label: "Точка", color: "#8E44AD" },
  { id: "other", label: "Друго", color: "#95A5A6" },
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
    COMMUNITY_PIN_CATEGORIES.find((c) => c.id === category)?.color ?? "#95A5A6"
  );
}

/** Human-readable remaining time until pin expiry. */
export function formatPinExpiry(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "изтекъл";
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours < 24) return `още ~${hours} ч`;
  const days = Math.ceil(hours / 24);
  return `още ~${days} д`;
}
