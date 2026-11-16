import { describe, expect, it } from "vitest";
import { getAllEuropeanCrossings } from "@/lib/constants/european-borders";
import { expectedWait, localTypicalMinutes } from "@/lib/planner/wait";

describe("localTypicalMinutes", () => {
  const kapitan = getAllEuropeanCrossings().find(
    (crossing) => crossing.id === "kapitan-andreevo"
  );
  const table = kapitan?.typical_wait_minutes ?? [];

  it("reads Kapitan Andreevo table at 07:00 and 10:00 Europe/Sofia", () => {
    const at7 = new Date("2026-11-15T05:00:00.000Z");
    const at10 = new Date("2026-11-15T08:00:00.000Z");
    expect(localTypicalMinutes(table, at7)).toBe(table[7]);
    expect(localTypicalMinutes(table, at10)).toBe(table[10]);
  });

  it("returns null for a missing table", () => {
    expect(localTypicalMinutes(null, new Date())).toBeNull();
  });

  it("attaches eta_iso and now_minutes when arrival and now differ", () => {
    const table = Array.from({ length: 24 }, (_, hour) =>
      hour === 7 ? 25 : hour === 10 ? 20 : 15
    );
    const now = new Date("2026-11-16T05:00:00.000Z");
    const eta = new Date("2026-11-16T08:00:00.000Z");
    const estimate = expectedWait({
      eta,
      now,
      forecast: null,
      dayStats: null,
      current: null,
      localTypical: table,
      licensed: true,
      locale: "bg",
    });
    expect(estimate.minutes).toBe(20);
    expect(estimate.now_minutes).toBe(25);
    expect(estimate.eta_iso).toBe(eta.toISOString());
  });
});