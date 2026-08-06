import { describe, expect, it } from "vitest";
import {
  COMMUNITY_PIN_CATEGORY_IDS,
  communityPinColor,
  communityPinLabel,
  formatPinExpiry,
} from "@/lib/constants/community-pins";

describe("community pin helpers", () => {
  it("includes the Phase 2 categories", () => {
    expect(COMMUNITY_PIN_CATEGORY_IDS).toContain("camera");
    expect(COMMUNITY_PIN_CATEGORY_IDS).toContain("food");
    expect(COMMUNITY_PIN_CATEGORY_IDS).toContain("overnight");
  });

  it("returns labels and colors", () => {
    expect(communityPinLabel("police")).toBe("Полиция");
    expect(communityPinColor("camera")).toMatch(/^#/);
  });

  it("formats expiry remaining time", () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(formatPinExpiry(inTwoHours)).toMatch(/още ~/);
    expect(formatPinExpiry(null)).toBeNull();
    const past = new Date(Date.now() - 1000).toISOString();
    expect(formatPinExpiry(past)).toBe("изтекъл");
  });
});
