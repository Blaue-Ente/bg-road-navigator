"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userStore = useUserStore();
  const { session, isLoading } = userStore;

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return <div className="text-center p-8">Зареждане...</div>;
  }

  if (!session) {
    return <div className="text-center p-8">Моля влезте в профила си</div>;
  }

  return <>{children}</>;
}
