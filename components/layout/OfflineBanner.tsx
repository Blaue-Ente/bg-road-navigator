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
    <div className="fixed top-16 left-0 right-0 bg-amber-600 text-white text-center py-2 z-25">
      <span className="text-sm">
        ⚠️ Няма интернет връзка. Спешните номера са достъпни офлайн.
        <a href="/emergency" className="underline ml-2">Отвори</a>
      </span>
    </div>
  );
}