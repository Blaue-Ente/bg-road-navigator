import { describe, expect, it } from "vitest";
import { isPeakChargingTime } from "@/lib/planner/ev-peak";

describe("peak charging hours", () => {
  it("flags the weekday evening, in the zone of the stop", () => {
    // Fri 19 Dec 2026, 16:45 UTC = 17:45 in Berlin
    expect(isPeakChargingTime("2026-12-18T16:45:00.000Z", "Europe/Berlin")).toBe(true);
  });

  it("does not flag a weekday midday or late night", () => {
    expect(isPeakChargingTime("2026-12-18T11:00:00.000Z", "Europe/Berlin")).toBe(false);
    expect(isPeakChargingTime("2026-12-18T22:30:00.000Z", "Europe/Berlin")).toBe(false);
  });

  it("flags a weekend midday but not a weekend morning", () => {
    // Sat 19 Dec 2026
    expect(isPeakChargingTime("2026-12-19T12:00:00.000Z", "Europe/Berlin")).toBe(true);
    expect(isPeakChargingTime("2026-12-19T06:00:00.000Z", "Europe/Berlin")).toBe(false);
  });

  it("uses the zone: the same instant is peak in one and not in the other", () => {
    expect(isPeakChargingTime("2026-12-18T16:45:00.000Z", "Europe/Sofia")).toBe(true);
    expect(isPeakChargingTime("2026-12-18T14:00:00.000Z", "Europe/Sofia")).toBe(false);
  });
});
