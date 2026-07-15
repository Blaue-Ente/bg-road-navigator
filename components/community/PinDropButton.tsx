"use client";

import { useUserStore } from "@/lib/stores/user.store";
import { useCommunityStore } from "@/lib/stores/community.store";

export function PinDropButton() {
  const authenticated = !!useUserStore((s) => s.session);
  const setDropMode = useCommunityStore((s) => s.setDropMode);

  if (!authenticated) {
    return null;
  }

  return (
    <button
      onClick={() => setDropMode(true)}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl shadow-lg transition hover:bg-blue-700"
      aria-label="Добави маркер"
    >
      📍
    </button>
  );
}
