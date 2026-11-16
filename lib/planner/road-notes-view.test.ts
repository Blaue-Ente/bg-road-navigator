import { describe, expect, it } from "vitest";
import { roadNotesView } from "@/lib/planner/road-notes-view";
import type { Hotspot } from "@/lib/hotspots/types";

function hotspot(id: string, severity: number): Hotspot {
  return {
    id,
    country: "BG",
    lng: 23,
    lat: 42,
    count: 5,
    fatal: 0,
    serious: 0,
    slight: 5,
    severity,
    year_from: 2020,
    year_to: 2024,
    source_id: "test",
  };
}

describe("roadNotesView", () => {
  it("returns top 3, rest 107, and summary with 110 for many hotspots", () => {
    const hotspots = Array.from({ length: 110 }, (_, index) =>
      hotspot(`h-${index}`, index)
    );
    const view = roadNotesView(hotspots, [], "bg");
    expect(view.top).toHaveLength(3);
    expect(view.rest).toHaveLength(107);
    expect(view.summary).toContain("110");
    expect(view.total).toBe(110);
  });
});