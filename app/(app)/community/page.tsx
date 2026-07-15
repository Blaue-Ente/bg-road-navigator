"use client";

import { useEffect, useState } from "react";
import { useCommunityStore } from "@/lib/stores/community.store";
import { PinDropButton } from "@/components/community/PinDropButton";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PinCategorySelector } from "@/components/community/PinCategorySelector";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import type { CommunityPin } from "@/types/community.types";

const SAMPLE_PINS: CommunityPin[] = [
  {
    id: "pin-1",
    category: "border_info",
    title: "Опашка на Калотина",
    description: "Около 45 минути за леки автомобили, дясната лента по-бърза.",
    coords: { lng: 22.8969, lat: 42.9833 },
    is_verified: true,
    upvotes: 12,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "pin-2",
    category: "road_works",
    title: "Ремонт на А1",
    description: "Стеснено движение между 42-ти и 45-ти км, скорост 60 км/ч.",
    coords: { lng: 23.5, lat: 42.4 },
    is_verified: false,
    upvotes: 5,
    expires_at: new Date(Date.now() + 172800000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

export default function CommunityPage() {
  const { pins, isDropMode, setDropMode, addPin, setPins } = useCommunityStore();
  const [selectedCategory, setSelectedCategory] =
    useState<CommunityPin["category"]>("border_info");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (pins.length === 0) setPins(SAMPLE_PINS);
  }, [pins.length, setPins]);

  const handleSavePin = () => {
    if (!title.trim()) return;
    addPin({
      id: `pin-${Date.now()}`,
      category: selectedCategory,
      title: title.trim(),
      description: null,
      coords: { lng: 23.32, lat: 42.7 },
      is_verified: false,
      upvotes: 0,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });
    setTitle("");
    setDropMode(false);
  };

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Общност"
          subtitle="Споделете информация за пътя — граници, инциденти, ремонти"
        />

        {isDropMode && (
          <>
            <button
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDropMode(false)}
              aria-label="Затвори"
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-8">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--waze-text-muted)]/40" />
              <h2 className="mb-4 text-lg font-bold text-[var(--waze-text)]">
                Нов маркер
              </h2>
              <div className="mb-4">
                <label className="mb-2 block text-xs text-[var(--waze-text-muted)]">
                  Категория
                </label>
                <PinCategorySelector
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
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
              <div className="flex gap-2">
                <button onClick={handleSavePin} className="waze-btn-primary flex-1 py-3 text-sm">
                  Публикувай
                </button>
                <button
                  onClick={() => setDropMode(false)}
                  className="waze-btn-secondary flex-1 py-3 text-sm"
                >
                  Откажи
                </button>
              </div>
            </div>
          </>
        )}

        {pins.length === 0 ? (
          <WazeCard className="py-8 text-center text-[var(--waze-text-muted)]">
            Няма активни маркери.
          </WazeCard>
        ) : (
          <CommunityFeed />
        )}
        <PinDropButton />
      </div>
    </div>
  );
}
