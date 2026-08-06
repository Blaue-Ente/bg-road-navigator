"use client";

import { COMMUNITY_PIN_CATEGORIES } from "@/lib/constants/community-pins";
import type { CommunityPinCategory } from "@/types/community.types";

export function PinCategorySelector({
  value,
  onChange,
}: {
  value: CommunityPinCategory;
  onChange: (category: CommunityPinCategory) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CommunityPinCategory)}
      className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none focus:border-[var(--waze-accent)]"
    >
      {COMMUNITY_PIN_CATEGORIES.map((category) => (
        <option key={category.id} value={category.id}>
          {category.label}
        </option>
      ))}
    </select>
  );
}
