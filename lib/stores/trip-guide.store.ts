import { create } from "zustand";
import type { TripGuide } from "@/lib/ai/trip-guide";

interface TripGuideState {
  /** The AI's written plan, by trip key, so the PDF and the plan sheet share it. */
  guides: Record<string, TripGuide>;
  setGuide: (key: string, guide: TripGuide) => void;
}

export const useTripGuideStore = create<TripGuideState>((set) => ({
  guides: {},
  setGuide: (key, guide) =>
    set((state) => ({ guides: { ...state.guides, [key]: guide } })),
}));
