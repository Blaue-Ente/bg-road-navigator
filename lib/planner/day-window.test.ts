import { describe, expect, it } from "vitest";
import { isNightStart, windowedDayLimits } from "@/lib/planner/day-window";

const limits = { overnight: true, overnightAfterMin: 720, overnightAtMin: 690 };
const tz = "Europe/Berlin";

describe("windowedDayLimits", () => {
  it("a start at 04:00 drives until the maximum (12 h), not 10", () => {
    const out = windowedDayLimits({
      departAt: new Date("2026-12-19T03:00:00Z"),
      timeZone: tz,
      limits,
    });
    expect(out.nightStart).toBe(false);
    expect(out.overnightAtMin).toBe(720);
  });

  it("a start at 11:00 stops near 22:00 instead of the maximum", () => {
    const out = windowedDayLimits({
      departAt: new Date("2026-12-19T10:00:00Z"),
      timeZone: tz,
      limits,
    });
    // 11 h to 22:00, about 87% of it driving.
    expect(out.overnightAtMin).toBeGreaterThan(540);
    expect(out.overnightAtMin).toBeLessThan(600);
  });

  it("a night start keeps the maximum and is marked", () => {
    const out = windowedDayLimits({
      departAt: new Date("2026-12-19T21:00:00Z"),
      timeZone: tz,
      limits,
    });
    expect(out.nightStart).toBe(true);
    expect(out.overnightAfterMin).toBe(720);
  });

  it("knows the night start hours", () => {
    expect(isNightStart(17.9)).toBe(false);
    expect(isNightStart(18)).toBe(true);
    expect(isNightStart(2.5)).toBe(true);
    expect(isNightStart(3)).toBe(false);
  });
});
