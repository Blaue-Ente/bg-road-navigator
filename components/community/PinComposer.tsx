"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCommunityStore } from "@/lib/stores/community.store";
import { PinCategorySelector } from "@/components/community/PinCategorySelector";
import type {
  CommunityPin,
  CommunityPinCategory,
} from "@/types/community.types";

interface PinComposerProps {
  /** When true, require map tap before publish (home map). */
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

  const waitingForTap = requireMapTap && !dropCoords;
  // Let the map page banner + clicks work; composer opens after a tap.
  if (waitingForTap) return null;

  const publish = async () => {
    if (!title.trim() || publishing) return;
    if (!dropCoords) {
      setError("Липсва позиция.");
      return;
    }

    setPublishing(true);
    setError(null);
    try {
      const response = await fetch("/api/community/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          coords: dropCoords,
          expires_in_hours: 24,
        }),
      });
      if (response.status === 401) {
        setError("Влезте в профила си, за да публикувате.");
        return;
      }
      if (response.status === 503) {
        setError("Общността изисква конфигуриран Supabase.");
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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
        onClick={() => cancelDrop()}
        aria-label="Затвори"
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--waze-text-muted)]/40" />
        <h2 className="mb-1 text-lg font-bold text-[var(--waze-text)]">
          Нов сигнал
        </h2>
        <p className="mb-4 text-xs text-[var(--waze-text-muted)]">
          {dropCoords
            ? `Позиция: ${dropCoords.lat.toFixed(4)}, ${dropCoords.lng.toFixed(4)}`
            : "Изберете категория и заглавие."}
        </p>

        <div className="mb-4">
          <label className="mb-2 block text-xs text-[var(--waze-text-muted)]">
            Категория
          </label>
          <PinCategorySelector value={category} onChange={setCategory} />
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-xs text-[var(--waze-text-muted)]">
            Заглавие
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Какво се случва?"
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none focus:border-[var(--waze-accent)]"
          />
        </div>
        {requireMapTap && (
          <button
            type="button"
            onClick={() => setDropCoords(null)}
            className="mb-3 text-xs text-[var(--waze-accent)]"
          >
            Избери друга точка на картата
          </button>
        )}
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void publish()}
            disabled={publishing || !title.trim()}
            className="waze-btn-primary flex-1 py-3 text-sm disabled:opacity-50"
          >
            {publishing ? "Публикуване…" : "Публикувай"}
          </button>
          <button
            type="button"
            onClick={() => cancelDrop()}
            className="waze-btn-secondary flex-1 py-3 text-sm"
          >
            Откажи
          </button>
        </div>
      </div>
    </>
  );
}
