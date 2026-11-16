"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  COMMUNITY_PIN_CATEGORIES,
  communityPinLabel,
} from "@/lib/constants/community-pins";
import type { CommunityPinCategory } from "@/types/community.types";

export function PinCategorySelector({
  value,
  onChange,
}: {
  value: CommunityPinCategory;
  onChange: (category: CommunityPinCategory) => void;
}) {
  const locale = useLocale();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CommunityPinCategory)}
      className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none focus:border-[var(--waze-accent)]"
    >
      {COMMUNITY_PIN_CATEGORIES.map((category) => (
        <option key={category.id} value={category.id}>
          {communityPinLabel(category.id, locale)}
        </option>
      ))}
    </select>
  );
}