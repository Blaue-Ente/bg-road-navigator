import { describe, expect, it } from "vitest";
import { shouldFlyToPosition } from "@/lib/hooks/useInitialLocation";

describe("shouldFlyToPosition", () => {
  it("follows a driver in Europe", () => {
    expect(shouldFlyToPosition({ lng: 13.4, lat: 52.5 })).toBe(true);
    expect(shouldFlyToPosition({ lng: 23.3, lat: 42.7 })).toBe(true);
  });
  it("keeps the Bulgaria view for a position outside Europe", () => {
    expect(shouldFlyToPosition({ lng: -74, lat: 40.7 })).toBe(false);
  });
});
