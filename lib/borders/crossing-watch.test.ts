import { describe, expect, it } from "vitest";
import {
  stepWatch,
  type CrossingPoint,
  type Fix,
  type Measurement,
  type WatchState,
} from "@/lib/borders/crossing-watch";

// A crossing on the equator-ish line so degrees map to km simply: 0.01 deg lng ~ 1.11 km.
const crossing: CrossingPoint = { id: "kalotina", lng: 22.0, lat: 43.0 };
const countryAt = (lng: number) => (lng < 22.0 ? "BG" : "RS");

const min = 60_000;
const t0 = Date.UTC(2026, 10, 17, 10, 0, 0);

/** Fills in a fix every few minutes between the given ones, as a phone would send. */
function every(fixes: Fix[], stepMin = 3): Fix[] {
  const out: Fix[] = [];
  fixes.forEach((fix, i) => {
    const prev = fixes[i - 1];
    if (prev) {
      const gaps = Math.floor((fix.t - prev.t) / (stepMin * min));
      for (let k = 1; k < gaps; k++) {
        const f = k / gaps;
        out.push({
          lng: prev.lng + (fix.lng - prev.lng) * f,
          lat: prev.lat,
          t: prev.t + (fix.t - prev.t) * f,
          speedKmh: prev.speedKmh,
        });
      }
    }
    out.push(fix);
  });
  return out;
}

function run(fixes: Fix[]): { state: WatchState; done: Measurement[] } {
  let state: WatchState = { phase: "idle" };
  const done: Measurement[] = [];
  for (const fix of fixes) {
    const step = stepWatch(state, fix, [crossing], countryAt);
    state = step.state;
    if (step.done) done.push(step.done);
  }
  return { state, done };
}

const at = (minute: number, lng: number, speedKmh: number | null = null): Fix => ({
  lng,
  lat: 43.0,
  t: t0 + minute * min,
  speedKmh,
});

describe("stepWatch", () => {
  it("measures the time from the first slow fix to moving freely on the other side", () => {
    const { done, state } = run(
      every([
        at(0, 21.97, 50), // enters the zone still moving
        at(2, 21.98, 8), // queue starts here
        at(20, 21.995, 5),
        at(40, 21.999, 6),
        at(45, 22.003, 10), // crossed into RS, still slow
        at(48, 22.02, 40), // free again
      ])
    );
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({
      crossingId: "kalotina",
      minutes: 46,
      fromCountry: "BG",
      toCountry: "RS",
      reliable: true,
    });
    expect(state.phase).toBe("idle");
  });

  it("asks nothing when the driver barely waited", () => {
    const { done } = run([at(0, 21.97, 50), at(1, 21.99, 40), at(2, 22.01, 40), at(3, 22.03, 50)]);
    expect(done).toEqual([]);
  });

  it("drops a pass that turns round or leaves without crossing", () => {
    const { done, state } = run([
      at(0, 21.97, 20),
      at(5, 21.98, 5),
      at(10, 21.95, 30),
      at(15, 21.9, 50), // out of the zone, still in BG
    ]);
    expect(done).toEqual([]);
    expect(state.phase).toBe("idle");
  });

  it("marks a measurement unreliable when fixes were missing for a long stretch", () => {
    const { done } = run([
      at(0, 21.97, 20),
      at(2, 21.98, 5),
      at(25, 21.999, 5), // 23 minutes with no fix: the phone was asleep
      at(28, 22.003, 8),
      at(31, 22.004, 8),
      at(33, 22.02, 40),
    ]);
    expect(done[0]?.reliable).toBe(false);
    expect(done[0]?.minutes).toBe(31);
  });

  it("works from positions alone when the device gives no speed", () => {
    // ~0.5 km in 10 minutes is queueing; ~2.2 km in one minute is free flow.
    const { done } = run(
      every([
        at(0, 21.97),
        at(10, 21.975),
        at(20, 21.98),
        at(30, 21.99),
        at(40, 22.001),
        at(41, 22.021),
      ])
    );
    expect(done).toHaveLength(1);
    // The slow stretch is counted from the first fix it describes.
    expect(done[0]!.minutes).toBeGreaterThanOrEqual(39);
    expect(done[0]!.reliable).toBe(true);
  });

  it("ignores fixes far from every crossing", () => {
    const { state } = run([at(0, 21.5, 80), at(5, 21.6, 80)]);
    expect(state.phase).toBe("idle");
  });
});
