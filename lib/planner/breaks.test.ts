import { describe, expect, it } from "vitest";
import { mergeDrivingBreaks } from "@/lib/planner/breaks";

describe("mergeDrivingBreaks", () => {
  it("folds a rest into a fuel stop within 30 minutes", () => {
    const stops = mergeDrivingBreaks({
      driveMin: 300,
      distanceKm: 400,
      breakEveryMin: 130,
      mergeWithinMin: 30,
      overnightAfterMin: 630,
      fuelStops: [{ kind: "fuel", distanceKm: 180, etaMin: 125 }],
    });

    const fuel = stops.find((stop) => stop.kinds.includes("fuel"));
    expect(fuel?.kinds).toEqual(expect.arrayContaining(["fuel", "rest"]));
    expect(fuel?.etaMin).toBe(125);
    expect(
      stops.some(
        (stop) =>
          stop.kinds.length === 1 &&
          stop.kinds[0] === "rest" &&
          stop.etaMin === 130
      )
    ).toBe(false);
    expect(
      stops.some((stop) => stop.etaMin === 260 && stop.kinds.includes("rest"))
    ).toBe(true);
    expect(stops.some((stop) => stop.kinds.includes("overnight"))).toBe(false);
  });

  it("suggests an overnight on a drive longer than 10.5 hours and merges it with fuel", () => {
    const stops = mergeDrivingBreaks({
      driveMin: 700,
      distanceKm: 900,
      breakEveryMin: 135,
      mergeWithinMin: 30,
      overnightAfterMin: 630,
      fuelStops: [{ kind: "fuel", distanceKm: 770, etaMin: 590 }],
    });

    const overnight = stops.find((stop) => stop.kinds.includes("overnight"));
    expect(overnight?.kinds).toEqual(
      expect.arrayContaining(["fuel", "overnight"])
    );
    expect(overnight?.etaMin).toBe(590);
    expect(
      stops.filter((stop) => stop.kinds.includes("overnight"))
    ).toHaveLength(1);
  });

  it("does not add an overnight on a short drive", () => {
    const stops = mergeDrivingBreaks({
      driveMin: 400,
      distanceKm: 500,
      breakEveryMin: 135,
      mergeWithinMin: 30,
      overnightAfterMin: 630,
      fuelStops: [],
    });
    expect(stops.every((stop) => stop.kinds.includes("rest"))).toBe(true);
  });
});
