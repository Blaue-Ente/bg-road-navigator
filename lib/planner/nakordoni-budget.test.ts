import { afterEach, describe, expect, it, vi } from "vitest";
import {
  corridorCheckpoints,
  BORDER_V4_PAIRS,
  DIRECTORY_COUNTRIES,
} from "@/lib/nakordoni/corridor";
import {
  applyCacheAge,
  buildCorridorRefreshJobs,
  isLicensedCheckpointOrigin,
  multiCallUnits,
  NAKORDONI_NEGATIVE_TTL_MS,
  negativeCachePayload,
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

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Nakordoni cache budget", () => {
  it("bills a full multi batch as heavy units, not one call per checkpoint", () => {
    expect(multiCallUnits(5, 2)).toBe(5);
    expect(multiCallUnits(10, 2)).toBe(5);
  });

  it("refuses Serbian and Turkish crossings even when the origin is Bulgaria", () => {
    expect(isLicensedCheckpointOrigin(12)).toBe(true);
    expect(isLicensedCheckpointOrigin(19)).toBe(true);
    expect(isLicensedCheckpointOrigin(13)).toBe(false);
    expect(isLicensedCheckpointOrigin(4)).toBe(false);
    expect(isLicensedCheckpointOrigin(14)).toBe(false);
    const ppids = corridorCheckpoints().map((row) => row.ppid);
    for (const ppid of ["id_384", "id_386", "id_388", "id_390"]) {
      expect(ppids).not.toContain(ppid);
    }
    const planned = buildCorridorRefreshJobs({
      ppids: ["id_384", "id_386", "id_388", "id_390", "id_484"],
      borderPairs: [
        { origin: 12, destination: 13, crossingType: 4 },
        { origin: 12, destination: 14, crossingType: 4 },
        { origin: 13, destination: 12, crossingType: 4 },
        { origin: 12, destination: 19, crossingType: 4 },
      ],
      directoryCountries: [14, 12],
    });
    const keys = planned.map((job) => job.key).join(" ");
    expect(keys).not.toMatch(/id_384|id_386|id_388|id_390|12:13|12:14/);
    expect(keys).toContain("id_484");
    expect(keys).toContain("border:12:19:4");
    expect(planned.some((job) => job.key === "directory:14")).toBe(false);
    expect(planned.some((job) => job.key === "directory:12")).toBe(true);
  });

  it("honours NAKORDONI_LICENSED_MARKETS when Serbia and Turkey are added", () => {
    vi.stubEnv("NAKORDONI_LICENSED_MARKETS", "12,13,14");
    const planned = buildCorridorRefreshJobs({
      ppids: ["id_390", "id_384"],
      borderPairs: [
        { origin: 12, destination: 13, crossingType: 4 },
        { origin: 12, destination: 14, crossingType: 4 },
      ],
      directoryCountries: [],
    });
    const keys = planned.map((job) => job.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "day-stats:id_390",
        "day-stats:id_384",
        "forecast:id_390:24",
        "border:12:13:4",
        "border:12:14:4",
      ])
    );
  });

  it("keeps a 401, 403 or 404 job out of the next tick for 24 hours", () => {
    const job = buildCorridorRefreshJobs({
      ppids: ["id_484"],
      borderPairs: [],
      directoryCountries: [],
    }).find((item) => item.kind === "day-stats");
    expect(job).toBeTruthy();
    const now = new Date("2026-11-15T06:00:00.000Z");
    const fresh = applyCacheAge(
      job!,
      {
        fetchedAt: new Date(now.getTime() - 60 * 60 * 1000),
        payload: negativeCachePayload(403),
      },
      now
    );
    expect(fresh.minIntervalMs).toBe(NAKORDONI_NEGATIVE_TTL_MS);
    expect(
      planNakordoniRefresh({
        jobs: [fresh],
        budget: {
          cheapUsed: 0,
          heavyUsed: 0,
          cheapSoftCap: NAKORDONI_SOFT_CAP.cheap,
          heavySoftCap: NAKORDONI_SOFT_CAP.heavy,
          cheapHardCap: NAKORDONI_HARD_CAP.cheap,
          heavyHardCap: NAKORDONI_HARD_CAP.heavy,
        },
      })
    ).toEqual([]);

    const expired = applyCacheAge(
      job!,
      {
        fetchedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        payload: negativeCachePayload(404),
      },
      now
    );
    expect(planNakordoniRefresh({
      jobs: [expired],
      budget: {
        cheapUsed: 0,
        heavyUsed: 0,
        cheapSoftCap: NAKORDONI_SOFT_CAP.cheap,
        heavySoftCap: NAKORDONI_SOFT_CAP.heavy,
        cheapHardCap: NAKORDONI_HARD_CAP.cheap,
        heavyHardCap: NAKORDONI_HARD_CAP.heavy,
      },
    }).map((item) => item.key)).toEqual([job!.key]);
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

    expect(heavy).toBe(15);
    expect(cheap).toBe(10);
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
