import { describe, expect, it } from "vitest";
import {
  capExpiryToUpdate,
  nakordoniRowUsable,
} from "@/lib/nakordoni/cache-store";

const HOUR = 60 * 60 * 1000;
const t = (ms: number) => new Date(Date.UTC(2026, 10, 24, 12) + ms);

describe("Nakordoni cache window (terms 6.1)", () => {
  it("never expires later than 24 h after updated_at", () => {
    const fetched = t(0);
    const expires = new Date(fetched.getTime() + 23 * HOUR);
    // updated 10 h before the fetch: 14 h left, not 23
    expect(capExpiryToUpdate(expires, t(-10 * HOUR)).getTime()).toBe(t(14 * HOUR).getTime());
    // updated just now: the 23 h window stays
    expect(capExpiryToUpdate(expires, t(0)).getTime()).toBe(expires.getTime());
    // no timestamp: unchanged
    expect(capExpiryToUpdate(expires, null).getTime()).toBe(expires.getTime());
  });

  it("refuses a row whose updated_at is older than 24 h even if its expiry is later", () => {
    const row = { expiresAt: t(5 * HOUR), observedAt: t(-25 * HOUR) };
    expect(nakordoniRowUsable(row, t(0))).toBe(false);
    expect(nakordoniRowUsable({ expiresAt: t(5 * HOUR), observedAt: t(-2 * HOUR) }, t(0))).toBe(true);
    expect(nakordoniRowUsable({ expiresAt: t(-1), observedAt: null }, t(0))).toBe(false);
    expect(nakordoniRowUsable({ expiresAt: t(HOUR), observedAt: null }, t(0))).toBe(true);
  });
});
