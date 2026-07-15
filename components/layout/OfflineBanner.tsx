"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed left-3 right-3 z-50 rounded-2xl bg-amber-500/95 px-4 py-2.5 text-center text-sm font-medium text-amber-950 shadow-lg"
      style={{ top: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
    >
      Няма интернет. Спешните номера са офлайн.
      <a href="/emergency" className="ml-2 underline font-semibold">
        Отвори
      </a>
    </div>
  );
}
