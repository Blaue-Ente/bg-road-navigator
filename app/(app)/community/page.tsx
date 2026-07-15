"use client";

import { useEffect, useState } from "react";
import { useCommunityStore } from "@/lib/stores/community.store";
import { PinDropButton } from "@/components/community/PinDropButton";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PinCategorySelector } from "@/components/community/PinCategorySelector";
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
    if (pins.length === 0) {
      setPins(SAMPLE_PINS);
    }
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
    <div className="h-full overflow-y-auto p-4 pb-24">
      <h1 className="mb-2 text-2xl font-bold text-blue-400">Общност</h1>
      <p className="mb-4 text-sm text-gray-400">
        Споделете информация за пътя — граници, инциденти, ремонти
      </p>

      {isDropMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Нов маркер</h2>
            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-400">Категория</label>
              <PinCategorySelector
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-400">Заглавие</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Какво се случва?"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSavePin}
                className="flex-1 rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
              >
                Публикувай
              </button>
              <button
                onClick={() => setDropMode(false)}
                className="flex-1 rounded bg-gray-700 py-2 text-white hover:bg-gray-600"
              >
                Откажи
              </button>
            </div>
          </div>
        </div>
      )}

      <CommunityFeed />
      <PinDropButton />
    </div>
  );
}
