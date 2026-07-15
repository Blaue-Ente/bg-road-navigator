"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useUserStore((s) => s.session);
  const isLoading = useUserStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !session) {
      const hasSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (hasSupabase) {
        router.push("/login");
      }
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-blue-400">
        Зареждане...
      </div>
    );
  }

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!session && hasSupabase) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p>Моля, влезте в профила си, за да продължите.</p>
        <a href="/login" className="text-blue-400 hover:text-blue-300">
          Вход
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
