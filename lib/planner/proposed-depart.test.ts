import { describe, expect, it } from "vitest";
import {
  formatDepartLocaleDisplay,
  proposedDepartLocalValue,
} from "@/lib/planner/proposed-depart";

describe("proposedDepartLocalValue", () => {
  it("returns the next local 08:00 after 22:30", () => {
    const now = new Date(2026, 10, 15, 22, 30, 0);
    expect(proposedDepartLocalValue(now)).toBe("2026-11-16T08:00");
  });

  it("returns today 08:00 before 08:00", () => {
    const now = new Date(2026, 10, 16, 7, 59, 0);
    expect(proposedDepartLocalValue(now)).toBe("2026-11-16T08:00");
  });

  it("returns tomorrow 08:00 at exactly 08:00", () => {
    const now = new Date(2026, 10, 16, 8, 0, 0);
    expect(proposedDepartLocalValue(now)).toBe("2026-11-17T08:00");
  });
});

describe("formatDepartLocaleDisplay", () => {
  it("formats without an explicit timeZone (matches datetime-local)", () => {
    const value = "2026-11-16T07:30";
    const date = new Date(value);
    const expected = new Intl.DateTimeFormat("bg-BG", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
    expect(formatDepartLocaleDisplay(value, "bg-BG")).toBe(expected);
  });
});