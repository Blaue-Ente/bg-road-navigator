import { create } from "zustand";
import type { Measurement } from "@/lib/borders/crossing-watch";

const KEY = "bgrn.border.pending.v1";
/** A measurement nobody confirmed within this long is dropped. */
const MAX_AGE_MS = 6 * 3_600_000;

interface BorderTimeState {
  pending: Measurement | null;
  /** Reads a measurement kept from before a reload. Call once on the client. */
  hydrate: () => void;
  offer: (measurement: Measurement) => void;
  clear: () => void;
}

function save(measurement: Measurement | null): void {
  try {
    if (measurement) localStorage.setItem(KEY, JSON.stringify(measurement));
    else localStorage.removeItem(KEY);
  } catch {
    // A private window can refuse storage; the prompt still works until reload.
  }
}

function isMeasurement(value: unknown): value is Measurement {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.crossingId === "string" &&
    typeof row.minutes === "number" &&
    typeof row.startedAt === "number" &&
    typeof row.endedAt === "number" &&
    typeof row.reliable === "boolean"
  );
}

export const useBorderTimeStore = create<BorderTimeState>((set) => ({
  pending: null,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isMeasurement(parsed) && Date.now() - parsed.endedAt < MAX_AGE_MS) {
        set({ pending: parsed });
      } else if (raw) {
        save(null);
      }
    } catch {
      // Unreadable storage: nothing to restore.
    }
  },
  offer: (pending) => {
    save(pending);
    set({ pending });
  },
  clear: () => {
    save(null);
    set({ pending: null });
  },
}));
