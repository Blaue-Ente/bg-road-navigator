import { create } from "zustand";

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
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  clearUser: () => set({ session: null, profile: null, isLoading: false }),
}));
