"use client";

import {
  OFFICIAL_VIGNETTE_LINKS,
  type VignetteLink,
} from "@/lib/constants/vignettes";
import { WazeCard } from "@/components/ui/WazeCard";

interface VignetteLinksProps {
  links?: VignetteLink[];
  title?: string;
  compact?: boolean;
}

export function VignetteLinks({
  links = OFFICIAL_VIGNETTE_LINKS,
  title = "Официални винетки и тол",
  compact = false,
}: VignetteLinksProps) {
  if (links.length === 0) return null;

  return (
    <WazeCard className={compact ? "!p-3" : undefined}>
      <h2
        className={
          compact
            ? "mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]"
            : "mb-3 text-sm font-semibold text-[var(--waze-text)]"
        }
      >
        {title}
      </h2>
      <p className="mb-3 text-xs text-[var(--waze-text-muted)]">
        Само официални портали — купувайте директно от държавата / концесионера.
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.country_code}>
            <a
              href={link.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2.5 transition hover:ring-1 hover:ring-[var(--waze-accent)]/40"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--waze-text)]">
                  <span className="mr-2 text-[var(--waze-accent)]">
                    {link.country_code}
                  </span>
                  {link.name_bg}
                </p>
                {link.notes_bg && !compact && (
                  <p className="mt-0.5 text-xs text-[var(--waze-text-muted)]">
                    {link.notes_bg}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-[var(--waze-accent)]">
                Отвори ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </WazeCard>
  );
}
