"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function MapOverlayColumn({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onRoute = pathname === "/route";

  return (
    <div
      className={`pointer-events-none absolute z-20 flex max-w-[calc(100vw-5rem)] flex-col-reverse items-start gap-2 left-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:max-w-[min(22rem,calc(100vw-1.5rem))] md:bottom-6 ${
        onRoute ? "md:left-[396px]" : "md:left-3"
      }`}
      data-overlay-slot="column"
    >
      {children}
    </div>
  );
}