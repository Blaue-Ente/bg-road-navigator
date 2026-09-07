import { describe, expect, it, beforeEach } from "vitest";
import { rateLimit, resetRateLimitForTests } from "@/lib/server/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("allows requests under the limit and then blocks", () => {
    const first = rateLimit("ip:/api/fuel", 2, 60_000, 1_000);
    const second = rateLimit("ip:/api/fuel", 2, 60_000, 1_100);
    const third = rateLimit("ip:/api/fuel", 2, 60_000, 1_200);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets after the window", () => {
    rateLimit("ip:/api/route", 1, 1_000, 0);
    const blocked = rateLimit("ip:/api/route", 1, 1_000, 500);
    const after = rateLimit("ip:/api/route", 1, 1_000, 1_001);
    expect(blocked.ok).toBe(false);
    expect(after.ok).toBe(true);
  });
});
