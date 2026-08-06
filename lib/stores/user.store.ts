import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types/profile.types";

export type { Profile };

export interface Session {
  user: {
    id: string;
    email: string;
  };
  access_token: string;
  expires_at: number;
}

interface UserState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      isLoading: true,
      setSession: (session) => set({ session, isLoading: false }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearUser: () => set({ session: null, profile: null, isLoading: false }),
    }),
    {
      name: "bg-road-user",
      partialize: (state) => ({
        session: state.session,
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
