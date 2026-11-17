import { describe, expect, it } from "vitest";
import { median, summarize } from "@/lib/db/border-reports";

describe("median", () => {
  it("takes the middle value so one odd report does not decide", () => {
    expect(median([20, 25, 300])).toBe(25);
    expect(median([10, 30])).toBe(20);
    expect(median([45])).toBe(45);
  });
});

describe("summarize", () => {
  it("groups by crossing with the count and the latest time", () => {
    const rows = [
      { crossingId: "kalotina", minutes: 40, reportedAt: new Date("2026-11-17T10:00:00Z") },
      { crossingId: "kalotina", minutes: 60, reportedAt: new Date("2026-11-17T11:00:00Z") },
      { crossingId: "kalotina", minutes: 50, reportedAt: new Date("2026-11-17T10:30:00Z") },
      { crossingId: "kulata", minutes: 15, reportedAt: new Date("2026-11-17T09:00:00Z") },
    ];
    const result = summarize(rows);
    expect(result.get("kalotina")).toEqual({
      minutes: 50,
      count: 3,
      latest_at: "2026-11-17T11:00:00.000Z",
    });
    expect(result.get("kulata")?.count).toBe(1);
    expect(result.has("other")).toBe(false);
  });
});
