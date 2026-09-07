"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function OfflineBanner() {
  const pathname = usePathname();
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );

  if (isOnline) return null;

  const onMap = pathname === "/";

  return (
    <div
      className="fixed left-3 right-3 z-50 rounded-2xl bg-amber-500/95 px-4 py-2.5 text-center text-sm font-medium text-amber-950 shadow-lg"
      style={{
        top: onMap
          ? "calc(4.25rem + env(safe-area-inset-top, 0px))"
          : "calc(0.75rem + env(safe-area-inset-top, 0px))",
      }}
    >
      Няма интернет. Спешните номера са офлайн.
      <Link href="/emergency" className="ml-2 underline font-semibold">
        Отвори
      </Link>
    </div>
  );
}
