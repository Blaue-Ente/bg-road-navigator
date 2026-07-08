"use client";

import { useUserStore } from "@/lib/stores/user.store";
import { useRouteStore } from "@/lib/stores/route.store";

interface TopBarProps {
  user: { id: string; email: string } | undefined;
}

export function TopBar({ user }: TopBarProps) {
  const routeStore = useRouteStore();
  const { activeRoute } = routeStore;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-blue-400">БГ Навигатор</h1>
      </div>

      <div className="flex-1 max-w-md mx-4">
        {activeRoute && (
          <div className="bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-white flex items-center justify-between overflow-hidden">
            <span className="truncate">
              {activeRoute.origin.label} → {activeRoute.destination.label}
            </span>
            <span className="text-blue-400 ml-2 whitespace-nowrap">
              {activeRoute.distance_km.toFixed(1)} км · {activeRoute.duration_min} мин
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 hidden md:block">
              {user.email}
            </span>
          </div>
        ) : (
          <a href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            Влез
          </a>
        )}
      </div>
    </header>
  );
}