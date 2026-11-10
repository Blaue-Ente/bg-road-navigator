"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserStore } from "@/lib/stores/user.store";
import type { Profile } from "@/types/profile.types";
import { authClient } from "@/lib/auth-client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setSession = useUserStore((s) => s.setSession);
  const setProfile = useUserStore((s) => s.setProfile);
  const setLoading = useUserStore((s) => s.setLoading);

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      setSession({
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        expires_at: Date.now() + 3600000,
      });
      void fetch("/api/profile")
        .then(async (response) => {
          if (!response.ok) return null;
          return response.json() as Promise<{ profile: Profile | null }>;
        })
        .then((payload) => {
          if (payload?.profile) setProfile(payload.profile);
        })
        .catch(() => undefined);
    } else if (!isPending) {
      setSession(null);
      setProfile(null);
    }
    setLoading(isPending);
  }, [isPending, session, setSession, setProfile, setLoading]);

  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthInitializer>{children}</AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
