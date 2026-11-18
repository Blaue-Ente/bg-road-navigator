import { describe, expect, it } from "vitest";
import { communityAlongRoute } from "@/lib/planner/community";
import type { CommunityPin } from "@/types/community.types";

// A road going east along latitude 50, about 71 km per degree of longitude.
const road: Array<[number, number]> = Array.from({ length: 41 }, (_, i) => [10 + i * 0.05, 50]);

function pin(overrides: Partial<CommunityPin>): CommunityPin {
  return {
    id: "p1",
    category: "bad_road",
    title: "Bad road",
    description: null,
    coords: { lng: 10.5, lat: 50.01 },
    is_verified: false,
    upvotes: 0,
    expires_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("bad road stretch", () => {
  it("is a note with its start and end on the road and a time cost by length", () => {
    const score = communityAlongRoute(road, [
      pin({ end_coords: { lng: 10.9, lat: 50.0 } }),
    ]);
    const note = score.notes[0]!;
    expect(note.from_km).toBeGreaterThan(30);
    expect(note.to_km!).toBeGreaterThan(note.from_km!);
    expect(note.penalty_min).toBeGreaterThan(5);
    expect(note.penalty_min).toBeLessThanOrEqual(20);
  });

  it("is left out when one end is far from the road", () => {
    const score = communityAlongRoute(road, [
      pin({ end_coords: { lng: 10.9, lat: 51.0 } }),
    ]);
    expect(score.notes).toHaveLength(0);
  });

  it("stays a plain note without an end", () => {
    const score = communityAlongRoute(road, [pin({})]);
    expect(score.notes[0]!.from_km).toBeUndefined();
    expect(score.notes[0]!.penalty_min).toBe(0);
  });
});
