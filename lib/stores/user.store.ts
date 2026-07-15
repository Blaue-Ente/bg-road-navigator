import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Session {
  user: {
    id: string;
    email: string;
  };
  access_token: string;
  expires_at: number;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  vehicle_type: "car" | "ev" | "truck" | "motorcycle";
  fuel_type: "diesel" | "petrol" | "lpg" | "electric";
  tank_capacity_liters: number | null;
  ev_range_km: number | null;
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
