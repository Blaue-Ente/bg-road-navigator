"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserStore } from "@/lib/stores/user.store";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setSession = useUserStore((s) => s.setSession);
  const setProfile = useUserStore((s) => s.setProfile);
  const setLoading = useUserStore((s) => s.setLoading);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const syncSession = async (
      session: {
        user: { id: string; email?: string };
        access_token: string;
        expires_at?: number;
      } | null
    ) => {
      if (session?.user) {
        setSession({
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
          },
          access_token: session.access_token,
          expires_at: session.expires_at ?? Date.now() + 3600000,
        });
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "id, username, avatar_url, vehicle_type, fuel_type, tank_capacity_liters, ev_range_km"
          )
          .eq("id", session.user.id)
          .maybeSingle();
        setProfile(profile);
      } else {
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProfile, setLoading]);

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
