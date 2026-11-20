import { describe, expect, it } from "vitest";
import { quietWindow } from "@/lib/borders/quiet-window";

describe("quietWindow", () => {
  it("finds the two quietest hours", () => {
    const hourly = Array.from({ length: 24 }, (_, h) => (h >= 2 && h <= 3 ? 5 : 40));
    expect(quietWindow(hourly)).toEqual({ from: 2, to: 4, minutes: 5 });
  });

  it("wraps past midnight", () => {
    const hourly = Array.from({ length: 24 }, (_, h) => (h === 23 || h === 0 ? 3 : 30));
    expect(quietWindow(hourly)).toEqual({ from: 23, to: 25, minutes: 3 });
  });

  it("says nothing for a flat profile or bad input", () => {
    expect(quietWindow(Array(24).fill(10))).toBeNull();
    expect(quietWindow([1, 2, 3])).toBeNull();
  });
});
