"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { formatTemplate } from "@/lib/i18n/format-template";

import { useState } from "react";
import { useCommunityStore } from "@/lib/stores/community.store";
import { CommentThread } from "@/components/community/CommentThread";
import { useUserStore } from "@/lib/stores/user.store";
import { WazeCard } from "@/components/ui/WazeCard";
import {
  communityPinLabel,
  formatPinAge,
  formatPinExpiry,
} from "@/lib/constants/community-pins";
import { Check, ThumbsUp, X } from "lucide-react";

export function CommunityFeed({
  pins: pinsProp,
}: {
  pins?: import("@/types/community.types").CommunityPin[];
}) {
  const m = useMessages();
  const locale = useLocale();
  const storePins = useCommunityStore((s) => s.pins);
  const pins = pinsProp ?? storePins;
  const { setSelectedPin, selectedPin, setPinUpvotes } = useCommunityStore();
  const authenticated = !!useUserStore((s) => s.session);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmPin = async (pinId: string, kind: "still_there" | "gone") => {
    if (!authenticated) {
      setActionError(m.community.msgad1bc1e110);
      return;
    }

    const response = await fetch(`/api/community/pins/${pinId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (!response.ok) {
      const message =
        response.status === 409
          ? m.community.msg2b6c205e59
          : response.status === 401
            ? m.community.msg4b42c2bda5
            : m.community.msg9ed05586e9;
      setActionError(message);
      return;
    }

    const payload = (await response.json()) as {
      upvotes: number;
      gone_count?: number;
    };
    setPinUpvotes(pinId, payload.upvotes);
    setActionError(null);
  };

  const reportPin = async (pinId: string) => {
    const response = await fetch(`/api/community/pins/${pinId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: m.community.msg91c5e1a750 }),
    });

    setActionError(
      response.ok
        ? m.community.msga0353392e6
        : response.status === 409
          ? m.community.msge347c023a4
          : m.community.msg73bc09ce43
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">{m.community.msgef67ba22e9}</h2>
        <span className="text-xs text-[var(--waze-text-muted)]">
          {pins.length}
        </span>
      </div>

      {pins.map((pin) => {
        const expiry = formatPinExpiry(pin.expires_at, locale);
        return (
          <WazeCard
            key={pin.id}
            className="cursor-pointer !p-4 transition hover:ring-1 hover:ring-[var(--waze-accent)]/30"
            onClick={() => setSelectedPin(pin)}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[var(--waze-text)]">
                  {pin.title}
                </h3>
                <p className="text-xs text-[var(--waze-accent-text)]">
                  {communityPinLabel(pin.category, locale)} ·{" "}
                  {formatPinAge(pin.created_at, locale)}
                  {expiry ? ` · ${expiry}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void confirmPin(pin.id, "still_there");
                  }}
                  className="flex items-center gap-1 rounded-full bg-[var(--waze-surface-elevated)] px-2 py-1 text-xs text-[var(--waze-text)]"
                  aria-label={m.community.msg6bfaef0a25}
                >
                  <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2} />
                  {formatTemplate(m.community.stillThere, {
                    count: String(pin.upvotes),
                  })}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void confirmPin(pin.id, "gone");
                  }}
                  className="flex items-center gap-1 rounded-full bg-[var(--waze-surface-elevated)] px-2 py-1 text-xs text-[var(--waze-text-secondary)]"
                  aria-label={m.community.msg6101a7d118}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />{m.community.msg6101a7d118}</button>
              </div>
            </div>

            {pin.description && (
              <p className="text-sm text-[var(--waze-text-secondary)]">
                {pin.description}
              </p>
            )}

            {pin.is_verified && (
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--waze-ok)]">
                <Check className="h-3 w-3" strokeWidth={2} />{m.community.msg627b93069d}</span>
            )}
          </WazeCard>
        );
      })}

      {selectedPin && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSelectedPin(null)}
            aria-label={m.nav.close}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--waze-text-muted)]/40" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--waze-text)]">
                {selectedPin.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--waze-surface-elevated)] text-[var(--waze-text-muted)]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--waze-accent-muted)] px-2.5 py-0.5 text-xs text-[var(--waze-accent-text)]">
                {communityPinLabel(selectedPin.category, locale)}
              </span>
              {formatPinExpiry(selectedPin.expires_at, locale) && (
                <span className="rounded-full bg-[var(--waze-surface-elevated)] px-2.5 py-0.5 text-xs text-[var(--waze-text-muted)]">
                  {formatPinExpiry(selectedPin.expires_at, locale)}
                </span>
              )}
            </div>
            {selectedPin.description && (
              <p className="mt-3 text-[var(--waze-text-secondary)]">
                {selectedPin.description}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => void confirmPin(selectedPin.id, "still_there")}
                className="waze-btn-primary flex-1 py-2.5 text-sm"
              >
                {formatTemplate(m.community.stillThereParen, {
                  count: String(selectedPin.upvotes),
                })}
              </button>
              <button
                type="button"
                onClick={() => void confirmPin(selectedPin.id, "gone")}
                className="waze-btn-secondary flex-1 py-2.5 text-sm"
              >{m.community.msg6101a7d118}</button>
              {authenticated && (
                <button
                  type="button"
                  onClick={() => void reportPin(selectedPin.id)}
                  className="waze-btn-secondary flex-1 py-2.5 text-sm"
                >{m.community.msg8e2d584d7c}</button>
              )}
            </div>

            {actionError && (
              <p className="mt-3 text-sm text-[var(--waze-text-secondary)]">
                {actionError}
              </p>
            )}

            <CommentThread pinId={selectedPin.id} />
          </div>
        </>
      )}
    </div>
  );
}
