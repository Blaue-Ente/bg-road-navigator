"use client";

import { useCommunityStore } from "@/lib/stores/community.store";
import { PinDropButton } from "@/components/community/PinDropButton";
import { CommunityFeed } from "@/components/community/CommunityFeed";

export default function CommunityPage() {
  const communityStore = useCommunityStore();
  const { pins, isDropMode } = communityStore;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4 text-blue-400">Общност</h1>

      {isDropMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Дърпане на маркер</h2>
            <p className="mb-4">Изберете категория</p>
            <PinCategorySelector onChange={(category) => {}} />
            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Запази</button>
              <button className="px-4 py-2 bg-gray-700 text-white rounded">Откажи</button>
            </div>
          </div>
        </div>
      )}

      <CommunityFeed />
      <PinDropButton />
    </div>
  );
}