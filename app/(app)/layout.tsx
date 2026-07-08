"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useUserStore } from "@/lib/stores/user.store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userStore = useUserStore();
  const user = userStore.session?.user;

  // Don't apply AuthGuard to auth routes
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  const content = isAuthRoute ? children : (
    <AuthGuard>
      <div className="relative h-screen overflow-hidden">
        <TopBar user={user} />
        <main className="pt-16 pb-20 h-[calc(100vh-4rem)] overflow-hidden">
          {children}
        </main>
        <BottomNav />
        <Sidebar />
        <OfflineBanner />
      </div>
    </AuthGuard>
  );

  return content;
}