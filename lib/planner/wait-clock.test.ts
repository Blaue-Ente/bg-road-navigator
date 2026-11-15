import { describe, expect, it } from "vitest";
import { getAllEuropeanCrossings } from "@/lib/constants/european-borders";
import { localTypicalMinutes } from "@/lib/planner/wait";

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
});