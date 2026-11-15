import { describe, expect, it } from "vitest";
import {
  corridorCheckpoints,
  BORDER_V4_PAIRS,
  DIRECTORY_COUNTRIES,
} from "@/lib/nakordoni/corridor";
import {
  buildCorridorRefreshJobs,
  isLicensedCheckpointOrigin,
  multiCallUnits,
  NAKORDONI_HARD_CAP,
  NAKORDONI_SOFT_CAP,
  NAKORDONI_TICK_CAP,
  planNakordoniRefresh,
  type RefreshJob,
} from "@/lib/planner/nakordoni-budget";

function corridorJobs(ageMs: number | null): RefreshJob[] {
  return buildCorridorRefreshJobs({
    ppids: corridorCheckpoints().map((row) => row.ppid),
    borderPairs: [...BORDER_V4_PAIRS],
    directoryCountries: [...DIRECTORY_COUNTRIES],
  }).map((job) => ({ ...job, ageMs }));
}

describe("Nakordoni cache budget", () => {
  it("bills a full multi batch as heavy units, not one call per checkpoint", () => {
    expect(multiCallUnits(5, 2)).toBe(5);
    expect(multiCallUnits(10, 2)).toBe(5);
  });

  it("refuses Serbian, Hungarian and Turkish origins", () => {
    expect(isLicensedCheckpointOrigin(12)).toBe(true);
    expect(isLicensedCheckpointOrigin(19)).toBe(true);
    expect(isLicensedCheckpointOrigin(13)).toBe(false);
    expect(isLicensedCheckpointOrigin(4)).toBe(false);
    expect(isLicensedCheckpointOrigin(14)).toBe(false);
    const planned = buildCorridorRefreshJobs({
      ppids: ["id_390"],
      borderPairs: [{ origin: 13, destination: 12, crossingType: 4 }],
      directoryCountries: [14],
    });
    expect(planned.map((job) => job.kind)).toEqual([
      "queue",
      "day-stats",
      "forecast",
    ]);
  });

  it("keeps a cold daily refresh well under both the soft cap and the tick cap", () => {
    const planned = planNakordoniRefresh({
      jobs: corridorJobs(null),
      budget: {
        cheapUsed: 0,
        heavyUsed: 0,
        cheapSoftCap: NAKORDONI_SOFT_CAP.cheap,
        heavySoftCap: NAKORDONI_SOFT_CAP.heavy,
        cheapHardCap: NAKORDONI_HARD_CAP.cheap,
        heavyHardCap: NAKORDONI_HARD_CAP.heavy,
      },
      maxUnitsThisTick: NAKORDONI_TICK_CAP,
    });
    const heavy = planned
      .filter((job) => job.quota === "heavy")
      .reduce((sum, job) => sum + job.units, 0);
    const cheap = planned
      .filter((job) => job.quota === "cheap")
      .reduce((sum, job) => sum + job.units, 0);

    expect(heavy).toBe(25);
    expect(cheap).toBe(14);
    expect(heavy).toBeLessThan(NAKORDONI_SOFT_CAP.heavy);
    expect(cheap).toBeLessThan(NAKORDONI_SOFT_CAP.cheap);
  });

  it("does not refresh a cache that is still inside its interval", () => {
    const planned = planNakordoniRefresh({
      jobs: corridorJobs(60_000),
      budget: {
        cheapUsed: 0,
        heavyUsed: 0,
        cheapSoftCap: NAKORDONI_SOFT_CAP.cheap,
        heavySoftCap: NAKORDONI_SOFT_CAP.heavy,
        cheapHardCap: NAKORDONI_HARD_CAP.cheap,
        heavyHardCap: NAKORDONI_HARD_CAP.heavy,
      },
    });
    expect(planned).toEqual([]);
  });

  it("stops before the soft heavy cap even when the tick still has room", () => {
    const planned = planNakordoniRefresh({
      jobs: corridorJobs(null),
      budget: {
        cheapUsed: 0,
        heavyUsed: 78,
        cheapSoftCap: 400,
        heavySoftCap: 80,
        cheapHardCap: 1000,
        heavyHardCap: 200,
      },
      maxUnitsThisTick: { cheap: 40, heavy: 40 },
    });
    const heavy = planned
      .filter((job) => job.quota === "heavy")
      .reduce((sum, job) => sum + job.units, 0);
    expect(heavy).toBeLessThanOrEqual(2);
    expect(78 + heavy).toBeLessThanOrEqual(80);
  });
});
