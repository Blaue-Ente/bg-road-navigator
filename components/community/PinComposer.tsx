"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCommunityStore } from "@/lib/stores/community.store";
import { PinCategorySelector } from "@/components/community/PinCategorySelector";
import {
  COMMUNITY_PIN_CATEGORIES,
  communityPinLabel,
  MAX_SEGMENT_KM,
} from "@/lib/constants/community-pins";
import { haversineKm } from "@/lib/geo/haversine";
import { formatTemplate } from "@/lib/i18n/format-template";
import type {
  CommunityPin,
  CommunityPinCategory,
} from "@/types/community.types";

interface PinComposerProps {
  /** When true, a map point is already chosen and a type tap publishes. */
  requireMapTap?: boolean;
}

export function PinComposer({ requireMapTap = false }: PinComposerProps) {
  const m = useMessages();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const {
    isDropMode,
    dropCoords,
    dropEndCoords,
    segmentPending,
    cancelDrop,
    addPin,
    setDropCoords,
    setDropEndCoords,
    setSegmentPending,
  } = useCommunityStore();
  const [category, setCategory] = useState<CommunityPinCategory>("traffic_jam");
  const [title, setTitle] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape closes it, for a keyboard or a desktop browser.
  useEffect(() => {
    if (!isDropMode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelDrop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDropMode, cancelDrop]);

  if (!isDropMode) return null;
  if (requireMapTap && !dropCoords) return null;
  // Waiting for the end of a bad stretch: the map must be tappable, so no sheet.
  if (segmentPending) return null;

  const segmentKm =
    dropCoords && dropEndCoords ? haversineKm(dropCoords, dropEndCoords) : null;
  const segmentTooLong = segmentKm != null && segmentKm > MAX_SEGMENT_KM;

  const publish = async (
    nextCategory: CommunityPinCategory,
    nextTitle?: string,
    withEnd = true
  ) => {
    if (publishing) return;
    if (!dropCoords) {
      setError(m.community.msgb0bc120138);
      return;
    }
    const label = nextTitle?.trim() || communityPinLabel(nextCategory, locale);
    setPublishing(true);
    setError(null);
    try {
      const response = await fetch("/api/community/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: nextCategory,
          title: label,
          text: nextTitle?.trim() && nextTitle.trim() !== label ? nextTitle.trim() : null,
          coords: dropCoords,
          ...(withEnd && nextCategory === "bad_road" && dropEndCoords && !segmentTooLong
            ? { end_coords: dropEndCoords }
            : {}),
        }),
      });
      if (response.status === 401) {
        setError(m.community.msgdb0d2993fa);
        return;
      }
      if (response.status === 503) {
        setError(m.community.msg2369c27ff2);
        return;
      }
      if (response.status === 429) {
        setError(m.community.msga26e568af9);
        return;
      }
      if (!response.ok) throw new Error("publish failed");
      const { pin } = (await response.json()) as { pin: CommunityPin };
      addPin(pin);
      await queryClient.invalidateQueries({ queryKey: ["community-pins"] });
      setTitle("");
      setDropEndCoords(null);
      cancelDrop();
    } catch {
      setError(m.community.msg9910278408);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="pointer-events-auto fixed inset-0 z-[55] bg-black/40"
        onClick={() => cancelDrop()}
        aria-label={m.community.msg0b9f7c6d05}
      />
      <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[60] max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 md:left-4 md:right-auto md:w-[360px] md:rounded-3xl md:pb-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--waze-border)] md:hidden" />
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold text-[var(--waze-text)]">{m.community.msg3707faa7c5}</h2>
          <button
            type="button"
            onClick={() => cancelDrop()}
            aria-label={m.community.closeComposer}
            className="-mt-1 -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--waze-text)]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mb-4 text-xs text-[var(--waze-text-secondary)]">
          {dropCoords
            ? `${dropCoords.lat.toFixed(4)}, ${dropCoords.lng.toFixed(4)}`
            : m.community.msg847c420eb1}
        </p>

        {requireMapTap ? (
          <div className="grid grid-cols-2 gap-2">
            {COMMUNITY_PIN_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={publishing}
                onClick={() => {
                  // A bad road is a stretch: ask for where it ends before publishing.
                  if (item.id === "bad_road" && !dropEndCoords) {
                    setSegmentPending(true);
                    return;
                  }
                  void publish(item.id);
                }}
                className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-left text-sm font-medium text-[var(--waze-text)] disabled:opacity-50"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-white" style={{ background: item.color }}>
                  {item.glyph}
                </span>
                {communityPinLabel(item.id, locale)}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-2 block text-xs text-[var(--waze-text-secondary)]">{m.community.msg19c85838e6}</label>
              <PinCategorySelector value={category} onChange={setCategory} />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-xs text-[var(--waze-text-secondary)]">{m.community.msg4e79ed256a}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={communityPinLabel(category, locale)}
                className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void publish(category, title)}
              disabled={publishing}
              className="waze-btn-primary w-full py-3 text-sm disabled:opacity-50"
            >
              {publishing ? m.community.msgdc759d77e4 : m.community.msg74d5fe4001}
            </button>
          </>
        )}

        {requireMapTap && dropEndCoords && segmentKm != null ? (
          <div className="mt-3 rounded-xl border border-[var(--waze-border)] p-3">
            <p className="text-sm text-[var(--waze-text)]">
              {formatTemplate(m.community.badRoadSegment, {
                km: segmentKm.toFixed(1),
                a: `${dropCoords?.lat.toFixed(3)}, ${dropCoords?.lng.toFixed(3)}`,
                b: `${dropEndCoords.lat.toFixed(3)}, ${dropEndCoords.lng.toFixed(3)}`,
              })}
            </p>
            {segmentTooLong ? (
              <p className="mt-1 text-sm text-[var(--waze-danger)]">
                {formatTemplate(m.community.badRoadTooLong, { max: String(MAX_SEGMENT_KM) })}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={publishing || segmentTooLong}
                onClick={() => void publish("bad_road")}
                className="waze-btn-primary min-h-11 px-4 text-sm font-semibold disabled:opacity-50"
              >
                {m.community.badRoadPublish}
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={() => void publish("bad_road", undefined, false)}
                className="waze-btn-secondary min-h-11 px-4 text-sm"
              >
                {m.community.badRoadPointOnly}
              </button>
            </div>
          </div>
        ) : null}

        {requireMapTap && (
          <button
            type="button"
            onClick={() => setDropCoords(null)}
            className="mt-3 text-xs text-[var(--waze-accent-text)]"
          >{m.community.msgc22737bfbf}</button>
        )}
        {error && <p className="mt-3 text-sm text-[var(--waze-danger)]">{error}</p>}
        <button
          type="button"
          onClick={() => cancelDrop()}
          className="mt-3 w-full text-sm text-[var(--waze-text-secondary)]"
        >{m.community.msg0bec2e932c}</button>
      </div>
    </>
  );
}
