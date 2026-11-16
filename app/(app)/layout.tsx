"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { LocaleOffer } from "@/components/i18n/LocaleOffer";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MenuProvider } from "@/components/layout/MenuContext";
import { MapHost } from "@/components/map/MapHost";
import { PlanDetailSheet } from "@/components/plan/PlanDetailSheet";
import { isReadingRoute } from "@/lib/constants/reading-routes";
import { useUserStore } from "@/lib/stores/user.store";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.session?.user);
  const pathname = usePathname();
  const isMap = pathname === "/";
  const isReading = isReadingRoute(pathname);

  return (
    <AuthGuard>
      <MenuProvider>
        <div className="relative h-[100dvh] overflow-hidden bg-[var(--map-canvas)]">
          {!isReading && <MapHost />}
          <main
            id="main-content"
            className={
              isMap
                ? "pointer-events-none absolute inset-0 z-10"
                : isReading
                  ? "absolute top-0 left-0 z-10 h-full w-full overflow-y-auto bg-[var(--waze-bg)] pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-0"
                  : "absolute top-0 left-0 z-10 w-full overflow-y-auto bg-[var(--waze-bg)] bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-0 md:w-[380px] md:border-r md:border-[var(--waze-border)]"
            }
          >
            {!isMap && <TopBar user={user} />}
            {!isMap && !isReading && <LocaleOffer placement="app" />}
            {children}
          </main>
          <BottomNav />
          <PlanDetailSheet />
          <Sidebar />
          <OfflineBanner />
        </div>
      </MenuProvider>
    </AuthGuard>
  );
}
