import { create } from "zustand";
import type { CommunityPin, PinComment } from "@/types/community.types";

interface CommunityState {
  pins: CommunityPin[];
  comments: PinComment[];
  selectedPin: CommunityPin | null;
  isDropMode: boolean;
  setPins: (pins: CommunityPin[]) => void;
  addPin: (pin: CommunityPin) => void;
  removePin: (id: string) => void;
  upvotePin: (id: string) => void;
  setPinUpvotes: (id: string, upvotes: number) => void;
  setSelectedPin: (pin: CommunityPin | null) => void;
  setDropMode: (mode: boolean) => void;
  setComments: (comments: PinComment[]) => void;
  addComment: (comment: PinComment) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  pins: [],
  comments: [],
  selectedPin: null,
  isDropMode: false,
  setPins: (pins) => set({ pins }),
  addPin: (pin) => set((state) => ({ pins: [...state.pins, pin] })),
  removePin: (id) => set((state) => ({ 
    pins: state.pins.filter((p) => p.id !== id) 
  })),
  upvotePin: (id) => set((state) => ({
    pins: state.pins.map((p) => 
      p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p
    )
  })),
  setPinUpvotes: (id, upvotes) =>
    set((state) => ({
      pins: state.pins.map((pin) =>
        pin.id === id ? { ...pin, upvotes } : pin
      ),
      selectedPin:
        state.selectedPin?.id === id
          ? { ...state.selectedPin, upvotes }
          : state.selectedPin,
    })),
  setSelectedPin: (pin) => set({ selectedPin: pin }),
  setDropMode: (mode) => set({ isDropMode: mode }),
  setComments: (comments) => set({ comments }),
  addComment: (comment) => set((state) => ({ 
    comments: [...state.comments, comment] 
  })),
}));