"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";

import {
  formatVignetteValidity,
  OFFICIAL_VIGNETTE_LINKS,
  type VignetteLink,
} from "@/lib/constants/vignettes";
import { pickText } from "@/lib/i18n/localized-field";
import { WazeCard } from "@/components/ui/WazeCard";
import { CountryFlag } from "@/components/ui/CountryFlag";
interface VignetteLinksProps {
  links?: VignetteLink[];
  title?: string;
  intro?: string;
  compact?: boolean;
}

export function VignetteLinks({
  links = OFFICIAL_VIGNETTE_LINKS,
  title,
  intro,
  compact = false,
}: VignetteLinksProps) {
  const locale = useLocale();
  const m = useMessages();
  const resolvedTitle = title ?? m.vignettes.msg82c840e11a;
  const resolvedIntro = intro ?? m.vignettes.msgb601ae0e79;
  if (links.length === 0) return null;

  return (
    <WazeCard className={compact ? "!p-3" : undefined}>
      <h2
        className={
          compact
            ? "mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]"
            : "mb-3 text-sm font-semibold text-[var(--waze-text)]"
        }
      >
        {resolvedTitle}
      </h2>
      <p className="mb-3 text-xs text-[var(--waze-text-muted)]">{resolvedIntro}</p>
      <ul className="space-y-2">
        {links.map((link) => {
          const displayName = pickText(locale, link.name);
          const displayNotes = link.notes
            ? pickText(locale, link.notes)
            : link.notes_bg;
          const validityLine = formatVignetteValidity(link, locale);
          return (
          <li key={link.country_code}>
            <a
              href={link.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2.5 transition hover:ring-1 hover:ring-[var(--waze-accent)]/40"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--waze-text)]">
                  <span className="mr-2 inline-flex align-middle">
                    <CountryFlag code={link.country_code} />
                  </span>
                  {displayName}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
                  {link.kind === "distance_toll" ? m.plan.msg725f5ff905 : m.plan.msg6497aa6c4f}
                </p>
                {displayNotes && !compact && (
                  <p className="mt-0.5 text-xs text-[var(--waze-text-muted)]">
                    {displayNotes}
                  </p>
                )}
                {validityLine && !compact && (
                  <p className="mt-0.5 text-xs text-[var(--waze-text-secondary)]">
                    {validityLine}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-[var(--waze-accent-text)]">
                {link.link_role === "info"
                  ? m.checklist.officialInfo
                  : m.checklist.officialShop}
              </span>
            </a>
          </li>
        );
        })}
      </ul>
    </WazeCard>
  );
}
