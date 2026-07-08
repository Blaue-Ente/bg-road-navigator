"use client";

import { useUserStore } from "@/lib/stores/user.store";

export function PinDropButton() {
  const userStore = useUserStore();
  const authenticated = !!userStore.session;

  if (!authenticated) {
    return null;
  }

  return (
    <button
      className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-blue-700 transition"
      aria-label="Дърпане на маркер"
    >
      📍
    </button>
  );
}