import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getHomeCity } from "@/lib/constants/european-cities";

const DEFAULT_HOME_CITY_ID = "sofia";

interface HomeState {
  homeCityId: string;
  setHomeCityId: (cityId: string) => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set) => ({
      homeCityId: DEFAULT_HOME_CITY_ID,
      setHomeCityId: (cityId) =>
        set({ homeCityId: getHomeCity(cityId).id }),
    }),
    { name: "bg-road-home" }
  )
);

export function selectHomeCityId(state: HomeState): string {
  return state.homeCityId || DEFAULT_HOME_CITY_ID;
}
