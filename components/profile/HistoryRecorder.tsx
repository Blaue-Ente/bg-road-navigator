"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { historyEntryFromPlan, historyPlanKey } from "@/lib/history/entry";
import { useRouteStore } from "@/lib/stores/route.store";
import { useUserStore } from "@/lib/stores/user.store";

/**
 * Records each plan a signed-in driver generates, once, so it shows in the
 * route history. A miss is silent: the history is a convenience.
 */
export function HistoryRecorder() {
  const plan = useRouteStore((state) => state.tripPlan);
  const via = useRouteStore((state) => state.planningVia);
  const signedIn = useUserStore((state) => Boolean(state.session?.user));
  const queryClient = useQueryClient();
  const sent = useRef(new Set<string>());

  useEffect(() => {
    if (!plan || !signedIn) return;
    const key = historyPlanKey(plan);
    if (sent.current.has(key)) return;
    sent.current.add(key);
    const entry = historyEntryFromPlan({ plan, via, fuelLevel: 0.8 });
    void fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    })
      .then((response) => {
        if (response.ok) void queryClient.invalidateQueries({ queryKey: ["route-history"] });
      })
      .catch(() => undefined);
  }, [plan, via, signedIn, queryClient]);

  return null;
}
