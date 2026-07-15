"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useUserStore } from "@/lib/stores/user.store";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.session?.user);
  const pathname = usePathname();
  const isMap = pathname === "/";

  return (
    <AuthGuard>
      <div className="relative h-screen overflow-hidden bg-[var(--waze-bg)]">
        <TopBar user={user} />
        <main
          className={
            isMap
              ? "h-screen overflow-hidden"
              : "h-screen overflow-hidden pt-[4.25rem]"
          }
        >
          {children}
        </main>
        <BottomNav />
        <Sidebar />
        <OfflineBanner />
      </div>
    </AuthGuard>
  );
}
