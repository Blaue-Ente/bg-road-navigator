import { describe, expect, it } from "vitest";
import {
  aggregateFlags,
  flagBias,
  flagWeight,
} from "@/lib/planner/flag-score";

const now = new Date("2026-11-15T12:00:00.000Z");

describe("place flag decay", () => {
  it("weighs a fresh flag more than an old one", () => {
    const fresh = flagWeight(new Date("2026-11-15T11:00:00.000Z"), now);
    const old = flagWeight(new Date("2026-09-15T12:00:00.000Z"), now);
    expect(fresh).toBeGreaterThan(old);
    expect(old).toBeLessThan(0.2);
  });

  it("penalises dirty and unsafe and boosts cheap and clean", () => {
    const flags = aggregateFlags(
      [
        {
          placeId: "osm-1",
          flag: "dirty",
          createdAt: new Date("2026-11-14T12:00:00.000Z"),
        },
        {
          placeId: "osm-1",
          flag: "unsafe",
          createdAt: now,
        },
        {
          placeId: "osm-2",
          flag: "cheap",
          createdAt: now,
        },
        {
          placeId: "osm-2",
          flag: "clean",
          createdAt: now,
        },
      ],
      now
    );
    const dirty = flagBias(flags.get("osm-1")?.weights, {
      with_pet: false,
      with_children: false,
    });
    const cheap = flagBias(flags.get("osm-2")?.weights, {
      with_pet: false,
      with_children: false,
    });
    expect(dirty).toBeLessThan(0);
    expect(cheap).toBeGreaterThan(0);
  });

  it("counts pet-friendly only when the trip includes a pet", () => {
    const weights = { pet_friendly: 1 };
    expect(flagBias(weights, { with_pet: false, with_children: false })).toBe(
      0
    );
    expect(flagBias(weights, { with_pet: true, with_children: false })).toBe(
      2.5
    );
  });
});
