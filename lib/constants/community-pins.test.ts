import { describe, expect, it } from "vitest";
import {
  COMMUNITY_PIN_CATEGORY_IDS,
  communityPinColor,
  communityPinLabel,
  formatPinAge,
  formatPinExpiry,
  shortLivedHours,
} from "@/lib/constants/community-pins";

describe("community pin helpers", () => {
  it("uses the trip-report categories", () => {
    expect(COMMUNITY_PIN_CATEGORY_IDS).toContain("traffic_jam");
    expect(COMMUNITY_PIN_CATEGORY_IDS).toContain("border_queue");
    expect(COMMUNITY_PIN_CATEGORY_IDS).toContain("shortcut");
    expect(COMMUNITY_PIN_CATEGORY_IDS).not.toContain("camera");
  });

  it("returns labels and colors", () => {
    expect(communityPinLabel("police")).toBe("Полиция");
    expect(communityPinColor("hotel")).toMatch(/^#/);
  });

  it("expires jams and keeps hotels", () => {
    expect(shortLivedHours("traffic_jam")).toBe(3);
    expect(shortLivedHours("hotel")).toBeNull();
  });

  it("formats expiry and age", () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(formatPinExpiry(inTwoHours)).toMatch(/още ~/);
    expect(formatPinExpiry(null)).toBeNull();
    const past = new Date(Date.now() - 1000).toISOString();
    expect(formatPinExpiry(past)).toBe("изтекъл");
    const twelveMin = new Date(Date.now() - 12 * 60 * 1000).toISOString();
    expect(formatPinAge(twelveMin)).toBe("преди 12 мин");
  });
});
