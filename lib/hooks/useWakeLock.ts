"use client";

import { useEffect, useState } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

/** Keeps the screen on while `enabled`. Returns whether the lock is held. */
export function useWakeLock(enabled: boolean): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const api = (
      navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
      }
    ).wakeLock;
    if (!enabled || !api) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const next = await api.request("screen");
        if (cancelled) {
          void next.release();
          return;
        }
        sentinel = next;
        setHeld(true);
      } catch {
        setHeld(false);
      }
    };
    // The browser drops the lock when the tab is hidden, so ask again on return.
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
      setHeld(false);
    };
  }, [enabled]);

  return enabled && held;
}
