"use client";

import { useState } from "react";
import { useCommunityStore } from "@/lib/stores/community.store";
import { useUserStore } from "@/lib/stores/user.store";
import { useRouteStore } from "@/lib/stores/route.store";
import { useCommunityPins } from "@/lib/hooks/useCommunityPins";

const PIN_CATEGORIES = [
  { value: "police", label: "Полицейски прилов" },
  { value: "accident", label: "Авария" },
  { value: "hazard", label: "Опасност" },
  { value: "road_works", label: "Работници на пътя" },
  { value: "traffic_jam", label: "Трафик" },
  { value: "fuel_issue", label: "Проблем с гориво" },
  { value: "border_info", label: "Информация за граница" },
  { value: "rest_area", label: "Почивна зона" },
  { value: "point_of_interest", label: "Точка на интерес" },
  { value: "other", label: "Друго" }
] as const;

export function PinDropForm({ coords, onClose }: { coords: { lng: number; lat: number }; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<typeof PIN_CATEGORIES[0]["value"]>("other");
  const [expiresIn, setExpiresIn] = useState<"1h" | "6h" | "24h" | "permanent">("1h");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const communityStore = useCommunityStore();
  const routeStore = useRouteStore();
  const { pins } = useCommunityPins();

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    // Calculate expiry
    let expiresAt: string | null = null;
    if (expiresIn !== "permanent") {
      const expiryHours = {
        "1h": 1,
        "6h": 6,
        "24h": 24
      }[expiresIn];
      expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    }

    const newPin = {
      id: crypto.randomUUID(),
      user_id: "current-user",
      category,
      title: title.trim(),
      description: description.trim() || null,
      coords,
      expires_at: expiresAt,
      is_verified: false,
      upvotes: 0,
      created_at: new Date().toISOString()
    };

    communityStore.addPin(newPin);
    communityStore.setDropMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Добави маркер</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Заглавие (макс. 100 кирилица)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
              placeholder="Опиши проблема..."
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">{title.length}/100</div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Описание (макс. 300 кирилица)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white resize-none"
              placeholder="Подробности..."
              rows={3}
              maxLength={300}
            />
            <div className="text-xs text-gray-500 mt-1">{description.length}/300</div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof PIN_CATEGORIES[0]["value"])}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
            >
              {PIN_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Срок на валидност</label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value as typeof expiresIn)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
            >
              <option value="1h">1 час</option>
              <option value="6h">6 часа</option>
              <option value="24h">24 часа</option>
              <option value="permanent">Всегда</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Откажи
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Публикуване..." : "Публикувай"}
          </button>
        </div>
      </div>
    </div>
  );
}