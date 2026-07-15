"use client";

import { useCommunityStore } from "@/lib/stores/community.store";
import { CommentThread } from "@/components/community/CommentThread";
import { useUserStore } from "@/lib/stores/user.store";
import { WazeCard } from "@/components/ui/WazeCard";

const CATEGORY_LABELS: Record<string, string> = {
  border_info: "Граница",
  road_works: "Ремонт",
  traffic_jam: "Опашка",
  accident: "Инцидент",
  police: "Полиция",
  hazard: "Опасност",
  fuel_issue: "Гориво",
  rest_area: "Почивка",
  point_of_interest: "Точка",
  other: "Друго",
};

export function CommunityFeed() {
  const { pins, setSelectedPin, selectedPin, upvotePin } = useCommunityStore();
  const authenticated = !!useUserStore((s) => s.session);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
          Активни маркери
        </h2>
        <span className="text-xs text-[var(--waze-text-muted)]">{pins.length}</span>
      </div>

      {pins.map((pin) => (
        <WazeCard
          key={pin.id}
          className="cursor-pointer !p-4 transition hover:ring-1 hover:ring-[var(--waze-accent)]/30"
          onClick={() => setSelectedPin(pin)}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[var(--waze-text)]">{pin.title}</h3>
              <p className="text-xs text-[var(--waze-accent)]">
                {CATEGORY_LABELS[pin.category] ?? pin.category}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                upvotePin(pin.id);
              }}
              className="flex items-center gap-1 rounded-full bg-[var(--waze-surface-elevated)] px-2 py-1 text-sm text-[var(--waze-text-secondary)]"
              aria-label="Подхвали"
            >
              👍 {pin.upvotes}
            </button>
          </div>

          {pin.description && (
            <p className="text-sm text-[var(--waze-text-secondary)]">{pin.description}</p>
          )}

          {pin.is_verified && (
            <span className="mt-2 inline-block text-[10px] font-medium text-emerald-400">
              ✓ Потвърдено
            </span>
          )}
        </WazeCard>
      ))}

      {selectedPin && (
        <>
          <button
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPin(null)}
            aria-label="Затвори"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--waze-text-muted)]/40" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--waze-text)]">
                {selectedPin.title}
              </h2>
              <button
                onClick={() => setSelectedPin(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--waze-surface-elevated)] text-[var(--waze-text-muted)]"
              >
                ✕
              </button>
            </div>

            <span className="rounded-full bg-[var(--waze-accent-muted)] px-2.5 py-0.5 text-xs text-[var(--waze-accent)]">
              {CATEGORY_LABELS[selectedPin.category] ?? selectedPin.category}
            </span>
            {selectedPin.description && (
              <p className="mt-3 text-[var(--waze-text-secondary)]">
                {selectedPin.description}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => upvotePin(selectedPin.id)}
                className="waze-btn-primary flex-1 py-2.5 text-sm"
              >
                Подхвали ({selectedPin.upvotes})
              </button>
              {authenticated && (
                <button className="waze-btn-secondary flex-1 py-2.5 text-sm">
                  Доклади
                </button>
              )}
            </div>

            <CommentThread pinId={selectedPin.id} />
          </div>
        </>
      )}
    </div>
  );
}
