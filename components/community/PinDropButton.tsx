"use client";

import { useUserStore } from "@/lib/stores/user.store";
import { useCommunityStore } from "@/lib/stores/community.store";

export function PinDropButton() {
  const authenticated = !!useUserStore((s) => s.session);
  const setDropMode = useCommunityStore((s) => s.setDropMode);

  if (!authenticated) return null;

  return (
    <button
      onClick={() => setDropMode(true)}
      className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4dd4ff] to-[#1a9fd4] text-xl font-bold text-[#0b0f14] shadow-lg transition active:scale-95"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Добави маркер"
    >
      +
    </button>
  );
}
