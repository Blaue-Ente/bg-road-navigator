import { create } from "zustand";
import {
  clearPlannerDraft,
  readPlannerDraft,
  writePlannerDraft,
  type DraftStorage,
  type PlannerDraft,
} from "@/lib/planner/planner-draft";

interface PlannerDraftState {
  draft: PlannerDraft | null;
  setDraft: (draft: PlannerDraft | null) => void;
  clearDraft: () => void;
}

function browserStorage(): DraftStorage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function persist(draft: PlannerDraft | null) {
  const storage = browserStorage();
  if (!storage) return;
  try {
    if (draft == null) clearPlannerDraft(storage);
    else writePlannerDraft(storage, draft);
  } catch {
    // Private mode can reject storage. The in-memory draft still covers this visit.
  }
}

export const usePlannerDraftStore = create<PlannerDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => {
    persist(draft);
    set({ draft });
  },
  clearDraft: () => {
    persist(null);
    set({ draft: null });
  },
}));

/** Read sessionStorage into the store. Called when the planner screen mounts. */
export function hydratePlannerDraft() {
  const storage = browserStorage();
  if (!storage) return;
  usePlannerDraftStore.setState({ draft: readPlannerDraft(storage) });
}
