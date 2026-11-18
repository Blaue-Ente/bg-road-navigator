import { describe, expect, it } from "vitest";
import type { BreakKind } from "@/lib/planner/breaks";
import {
  dwellMinutesBefore,
  mergeDrivingBreaks,
  resolveSleepShifts,
  sleepMinutesBefore,
  sleepShifts,
  wakeAt,
  wallClockEta,
} from "@/lib/planner/breaks";

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
      stops.some((stop) => stop.etaMin === 255 && stop.kinds.includes("rest"))
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

  it("keeps four rest stops on a long drive with the default break interval", () => {
    const stops = mergeDrivingBreaks({
      driveMin: 700,
      distanceKm: 900,
      breakEveryMin: 135,
      mergeWithinMin: 30,
      overnightAfterMin: 630,
      fuelStops: [],
    });
    const rests = stops.filter(
      (stop) => stop.kinds.includes("rest") && !stop.kinds.includes("overnight")
    );
    expect(rests.length).toBeGreaterThanOrEqual(4);
  });
});

describe("wakeAt", () => {
  const tz = "Europe/Sofia";

  it("after 18:00 Sofia sleeps until 08:00 the next morning", () => {
    const arrival = new Date("2026-11-16T16:00:00.000Z");
    const wake = wakeAt(arrival, tz);
    expect(wake.toISOString()).toBe("2026-11-17T06:00:00.000Z");
  });

  it("after 23:30 Sofia sleeps until 08:00", () => {
    const arrival = new Date("2026-11-16T21:30:00.000Z");
    const wake = wakeAt(arrival, tz);
    expect(wake.toISOString()).toBe("2026-11-17T06:00:00.000Z");
  });

  it("arriving by day after a night drive rests eight hours, not until tomorrow", () => {
    // 11:45 Bucharest-time arrival (09:45Z) must not wait for 08:00 next day.
    const arrival = new Date("2026-12-19T09:45:00.000Z");
    const wake = wakeAt(arrival, "Europe/Bucharest");
    expect(wake.toISOString()).toBe("2026-12-19T17:45:00.000Z");
  });

  it("after 05:00 Sofia waits at least eight hours", () => {
    const arrival = new Date("2026-11-16T03:00:00.000Z");
    const wake = wakeAt(arrival, tz);
    expect(wake.toISOString()).toBe("2026-11-16T11:00:00.000Z");
  });

  it("uses Budapest local 08:00 for an overnight in Hungary", () => {
    const arrival = new Date("2026-11-16T16:00:00.000Z");
    const wakeBudapest = wakeAt(arrival, "Europe/Budapest");
    expect(wakeBudapest.toISOString()).toBe("2026-11-17T07:00:00.000Z");
    const wakeSofia = wakeAt(arrival, "Europe/Sofia");
    expect(wakeSofia.toISOString()).toBe("2026-11-17T06:00:00.000Z");
    expect(
      new Intl.DateTimeFormat("bg-BG", {
        timeZone: "Europe/Sofia",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(wakeBudapest)
    ).toBe("09:00");
    expect(
      new Intl.DateTimeFormat("bg-BG", {
        timeZone: "Europe/Budapest",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(wakeBudapest)
    ).toBe("08:00");
  });
});

describe("dwell and wallClockEta", () => {
  it("overnight anchor ETA is 20:15 not 19:00 with four rests and one fuel", () => {
    const depart = new Date(2026, 10, 16, 7, 0, 0);
    const stops: Array<{ etaMin: number; kinds: BreakKind[] }> = [
      { etaMin: 135, kinds: ["rest"] },
      { etaMin: 270, kinds: ["rest"] },
      { etaMin: 405, kinds: ["rest"] },
      { etaMin: 540, kinds: ["rest"] },
      { etaMin: 600, kinds: ["fuel"] },
    ];
    const drivingMin = 720;
    const dwell = dwellMinutesBefore(drivingMin, stops, false);
    expect(dwell).toBe(75);
    const eta = wallClockEta({
      departAt: depart,
      drivingMin,
      extraWaitMin: 0,
      sleepShifts: [],
      dwellMin: dwell,
    });
    expect(eta.getHours()).toBe(20);
    expect(eta.getMinutes()).toBe(15);
  });

  it("with children uses longer rest dwell (monotonic at equal day limit)", () => {
    const depart = new Date(2026, 10, 16, 7, 0, 0);
    const stops: Array<{ etaMin: number; kinds: BreakKind[] }> = [
      { etaMin: 135, kinds: ["rest"] },
      { etaMin: 270, kinds: ["rest"] },
      { etaMin: 405, kinds: ["rest"] },
      { etaMin: 540, kinds: ["rest"] },
    ];
    const drivingMin = 600;
    const withoutChildren = wallClockEta({
      departAt: depart,
      drivingMin,
      extraWaitMin: 0,
      sleepShifts: [],
      dwellMin: dwellMinutesBefore(drivingMin, stops, false),
    });
    const withChildren = wallClockEta({
      departAt: depart,
      drivingMin,
      extraWaitMin: 0,
      sleepShifts: [],
      dwellMin: dwellMinutesBefore(drivingMin, stops, true),
    });
    expect(withChildren.getTime()).toBeGreaterThanOrEqual(withoutChildren.getTime());
  });
});

describe("sleepShifts", () => {
  it("is empty without overnight or on a short drive", () => {
    expect(
      sleepShifts({
        driveMin: 540,
        overnight: true,
        overnightAfterMin: 630,
        overnightAtMin: 600,
      })
    ).toEqual([]);
    expect(
      sleepShifts({
        driveMin: 880,
        overnight: false,
        overnightAfterMin: 630,
        overnightAtMin: 600,
      })
    ).toEqual([]);
  });

  it("locks the Berlin-shaped overnight timeline", () => {
    const depart = new Date("2026-11-16T06:00:00.000Z");
    const anchors = sleepShifts({
      driveMin: 880,
      overnight: true,
      overnightAfterMin: 630,
      overnightAtMin: 600,
    });
    expect(anchors).toHaveLength(1);
    expect(anchors[0]!.afterDrivingMin).toBe(600);
    const resolved = resolveSleepShifts({
      departAt: depart,
      shifts: anchors,
      extraWaitMin: () => 0,
    });
    expect(resolved[0]!.sleepMin).toBe(14 * 60);
    const stopArrival = wallClockEta({
      departAt: depart,
      drivingMin: 600,
      extraWaitMin: 0,
      sleepShifts: [],
    });
    expect(stopArrival.toISOString()).toBe("2026-11-16T16:00:00.000Z");
    const destination = wallClockEta({
      departAt: depart,
      drivingMin: 880,
      extraWaitMin: 0,
      sleepShifts: resolved,
    });
    expect(destination.toISOString()).toBe("2026-11-17T10:40:00.000Z");
    expect(sleepMinutesBefore(600, resolved)).toBe(0);
    expect(sleepMinutesBefore(601, resolved)).toBe(14 * 60);
  });
});

describe("mergeDrivingBreaks interval", () => {
  const base = {
    driveMin: 992,
    distanceKm: 1861,
    mergeWithinMin: 30,
    overnightAfterMin: 630,
    overnightAtMin: 600,
    fuelStops: [
      { kind: "fuel" as const, distanceKm: 520, etaMin: 280 },
      { kind: "fuel" as const, distanceKm: 1370, etaMin: 730 },
    ],
  };

  it("a longer interval never adds stops", () => {
    const short = mergeDrivingBreaks({ ...base, breakEveryMin: 120 });
    const long = mergeDrivingBreaks({ ...base, breakEveryMin: 240 });
    expect(long.length).toBeLessThan(short.length);
  });

  it("counts fuel and overnight stops as breaks", () => {
    const stops = mergeDrivingBreaks({ ...base, breakEveryMin: 240 });
    const times = stops.map((stop) => stop.etaMin);
    for (let i = 1; i < times.length; i++) {
      expect(times[i]! - times[i - 1]!).toBeLessThanOrEqual(240 + 30);
    }
    const rests = stops.filter(
      (stop) => stop.kinds.length === 1 && stop.kinds[0] === "rest"
    );
    expect(rests.length).toBeLessThanOrEqual(2);
  });

  it("does not label an overnight as a rest", () => {
    const stops = mergeDrivingBreaks({ ...base, breakEveryMin: 120 });
    for (const stop of stops.filter((s) => s.kinds.includes("overnight"))) {
      expect(stop.kinds).not.toContain("rest");
    }
  });
});
