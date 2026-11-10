"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCommunityStore } from "@/lib/stores/community.store";
import { PinCategorySelector } from "@/components/community/PinCategorySelector";
import {
  COMMUNITY_PIN_CATEGORIES,
  communityPinLabel,
} from "@/lib/constants/community-pins";
import type {
  CommunityPin,
  CommunityPinCategory,
} from "@/types/community.types";

interface PinComposerProps {
  /** When true, a map point is already chosen and a type tap publishes. */
  requireMapTap?: boolean;
}

export function PinComposer({ requireMapTap = false }: PinComposerProps) {
  const queryClient = useQueryClient();
  const { isDropMode, dropCoords, cancelDrop, addPin, setDropCoords } =
    useCommunityStore();
  const [category, setCategory] = useState<CommunityPinCategory>("traffic_jam");
  const [title, setTitle] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isDropMode) return null;
  if (requireMapTap && !dropCoords) return null;

  const publish = async (
    nextCategory: CommunityPinCategory,
    nextTitle?: string
  ) => {
    if (publishing) return;
    if (!dropCoords) {
      setError("Липсва позиция. Задръжте върху картата.");
      return;
    }
    const label = nextTitle?.trim() || communityPinLabel(nextCategory);
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
        }),
      });
      if (response.status === 401) {
        setError("Влезте в профила си, за да споделите сигнала.");
        return;
      }
      if (response.status === 503) {
        setError("Записите не са включени. Приложете миграцията от документацията.");
        return;
      }
      if (response.status === 429) {
        setError("Твърде много сигнали за кратко време.");
        return;
      }
      if (!response.ok) throw new Error("publish failed");
      const { pin } = (await response.json()) as { pin: CommunityPin };
      addPin(pin);
      await queryClient.invalidateQueries({ queryKey: ["community-pins"] });
      setTitle("");
      cancelDrop();
    } catch {
      setError("Сигналът не можа да бъде публикуван.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => cancelDrop()}
        aria-label="Затвори"
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 md:left-4 md:right-auto md:w-[360px] md:rounded-3xl md:pb-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--waze-border)] md:hidden" />
        <h2 className="mb-1 text-lg font-bold text-[var(--waze-text)]">
          Нов сигнал
        </h2>
        <p className="mb-4 text-xs text-[var(--waze-text-secondary)]">
          {dropCoords
            ? `${dropCoords.lat.toFixed(4)}, ${dropCoords.lng.toFixed(4)}`
            : "Изберете вид сигнал."}
        </p>

        {requireMapTap ? (
          <div className="grid grid-cols-2 gap-2">
            {COMMUNITY_PIN_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={publishing}
                onClick={() => void publish(item.id)}
                className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-left text-sm font-medium text-[var(--waze-text)] disabled:opacity-50"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-white" style={{ background: item.color }}>
                  {item.glyph}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mb-2 block text-xs text-[var(--waze-text-secondary)]">
                Категория
              </label>
              <PinCategorySelector value={category} onChange={setCategory} />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-xs text-[var(--waze-text-secondary)]">
                Какво да знаят другите
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={communityPinLabel(category)}
                className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void publish(category, title)}
              disabled={publishing}
              className="waze-btn-primary w-full py-3 text-sm disabled:opacity-50"
            >
              {publishing ? "Публикуване…" : "Публикувай"}
            </button>
          </>
        )}

        {requireMapTap && (
          <button
            type="button"
            onClick={() => setDropCoords(null)}
            className="mt-3 text-xs text-[var(--waze-accent-text)]"
          >
            Избери друга точка
          </button>
        )}
        {error && <p className="mt-3 text-sm text-[var(--waze-danger)]">{error}</p>}
        <button
          type="button"
          onClick={() => cancelDrop()}
          className="mt-3 w-full text-sm text-[var(--waze-text-secondary)]"
        >
          Откажи
        </button>
      </div>
    </>
  );
}
