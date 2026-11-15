import {
  isCheckpointLicensed,
  isLicensedMarket,
  isLicensedMarketPair,
  licensedMarketIds,
} from "@/lib/nakordoni/markets";

export {
  isLicensedMarket,
  isLicensedMarketPair,
  licensedMarketIds,
  LICENSED_ORIGIN_COUNTRY_IDS,
} from "@/lib/nakordoni/markets";

/**
 * Nakordoni Explorer: 1,000 cheap calls/day and 200 heavy calls/day, reset 00:00 UTC.
 * Multi, border v4 and forecast are heavy. Checkpoints and day-stats are cheap.
 * The cron stays under the soft caps so the existing borders page still has room.
 */

export type NakordoniQuota = "cheap" | "heavy";

export type NakordoniJobKind =
  "directory" | "day-stats" | "queue" | "forecast" | "border";

export interface RefreshJob {
  key: string;
  kind: NakordoniJobKind;
  quota: NakordoniQuota;
  units: number;
  /** Null when the cache has no row. */
  ageMs: number | null;
  minIntervalMs: number;
  priority: number;
}

export interface BudgetSnapshot {
  cheapUsed: number;
  heavyUsed: number;
  cheapSoftCap: number;
  heavySoftCap: number;
  cheapHardCap: number;
  heavyHardCap: number;
}

export interface PlannedRefresh {
  key: string;
  kind: NakordoniJobKind;
  quota: NakordoniQuota;
  units: number;
}

export const NAKORDONI_HARD_CAP = { cheap: 1000, heavy: 200 } as const;
/** Leave headroom under the published plan limits. */
export const NAKORDONI_SOFT_CAP = { cheap: 400, heavy: 80 } as const;
/** One invocation, so a daily Hobby cron can finish and a 15-min Pro cron cannot drain the day. */
export const NAKORDONI_TICK_CAP = { cheap: 40, heavy: 40 } as const;

export const REFRESH_INTERVAL_MS = {
  directory: 25 * 24 * 60 * 60 * 1000,
  "day-stats": 20 * 60 * 60 * 1000,
  queue: 6 * 60 * 60 * 1000,
  forecast: 12 * 60 * 60 * 1000,
  border: 12 * 60 * 60 * 1000,
} as const;

/**
 * A failed 401/403/404 is remembered this long so the next cron tick skips it.
 * Longer than the shortest success interval (queue is 6 h).
 */
export const NAKORDONI_NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;

export function isLicensedCheckpointOrigin(
  origin: number | null | undefined,
  markets: readonly number[] = licensedMarketIds()
): boolean {
  return isLicensedMarket(origin, markets);
}

export function isBackoffStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 404;
}

export function negativeCachePayload(status: number): {
  ok: false;
  negative: true;
  status: number;
} {
  return { ok: false, negative: true, status };
}

export function isNegativeCachePayload(payload: unknown): boolean {
  return (
    Boolean(payload) &&
    typeof payload === "object" &&
    (payload as { negative?: unknown }).negative === true
  );
}

/** A fresh negative row raises the interval to 24 h so the job is not due. */
export function applyCacheAge(
  job: RefreshJob,
  row: { fetchedAt: Date; payload: unknown } | undefined,
  now: Date
): RefreshJob {
  if (!row) return { ...job, ageMs: null };
  const ageMs = Math.max(0, now.getTime() - row.fetchedAt.getTime());
  if (
    isNegativeCachePayload(row.payload) &&
    ageMs < NAKORDONI_NEGATIVE_TTL_MS
  ) {
    return { ...job, ageMs, minIntervalMs: NAKORDONI_NEGATIVE_TTL_MS };
  }
  return { ...job, ageMs };
}

/** Multi bills ceil((ppids × sub-products) / 2), and only the first 5 ppids count. */
export function multiCallUnits(ppidCount: number, subproducts = 2): number {
  const ppids = Math.min(5, Math.max(0, ppidCount));
  if (ppids === 0 || subproducts <= 0) return 0;
  return Math.ceil((ppids * subproducts) / 2);
}

export interface CorridorRefreshInputs {
  ppids: string[];
  /** origin/destination/crossing_type. Both sides must be licensed. */
  borderPairs: Array<{
    origin: number;
    destination: number;
    crossingType: number;
  }>;
  directoryCountries: number[];
}

/** The full corridor shopping list. `planNakordoniRefresh` drops whatever is fresh or over budget. */
export function buildCorridorRefreshJobs(
  input: CorridorRefreshInputs
): RefreshJob[] {
  const jobs: RefreshJob[] = [];
  const markets = licensedMarketIds();
  const ppids = input.ppids.filter(
    (ppid) => ppid.startsWith("id_") && isCheckpointLicensed(ppid, markets)
  );

  for (let i = 0; i < ppids.length; i += 5) {
    const batch = ppids.slice(i, i + 5);
    jobs.push({
      key: `queue:${batch.join(",")}`,
      kind: "queue",
      quota: "heavy",
      units: multiCallUnits(batch.length, 2),
      ageMs: null,
      minIntervalMs: REFRESH_INTERVAL_MS.queue,
      priority: 1,
    });
  }

  for (const ppid of ppids) {
    jobs.push({
      key: `day-stats:${ppid}`,
      kind: "day-stats",
      quota: "cheap",
      units: 1,
      ageMs: null,
      minIntervalMs: REFRESH_INTERVAL_MS["day-stats"],
      priority: 2,
    });
  }

  for (const ppid of ppids) {
    jobs.push({
      key: `forecast:${ppid}:24`,
      kind: "forecast",
      quota: "heavy",
      units: 1,
      ageMs: null,
      minIntervalMs: REFRESH_INTERVAL_MS.forecast,
      priority: 3,
    });
  }

  for (const pair of input.borderPairs) {
    if (!isLicensedMarketPair(pair.origin, pair.destination, markets)) continue;
    jobs.push({
      key: `border:${pair.origin}:${pair.destination}:${pair.crossingType}`,
      kind: "border",
      quota: "heavy",
      units: 1,
      ageMs: null,
      minIntervalMs: REFRESH_INTERVAL_MS.border,
      priority: 4,
    });
  }

  for (const country of input.directoryCountries) {
    if (!isLicensedMarket(country, markets)) continue;
    jobs.push({
      key: `directory:${country}`,
      kind: "directory",
      quota: "cheap",
      units: 1,
      ageMs: null,
      minIntervalMs: REFRESH_INTERVAL_MS.directory,
      priority: 5,
    });
  }

  return jobs;
}

export function planNakordoniRefresh(input: {
  jobs: RefreshJob[];
  budget: BudgetSnapshot;
  maxUnitsThisTick?: { cheap: number; heavy: number };
}): PlannedRefresh[] {
  const tick = input.maxUnitsThisTick ?? NAKORDONI_TICK_CAP;
  const soft = {
    cheap: Math.min(input.budget.cheapSoftCap, input.budget.cheapHardCap),
    heavy: Math.min(input.budget.heavySoftCap, input.budget.heavyHardCap),
  };
  const used = {
    cheap: input.budget.cheapUsed,
    heavy: input.budget.heavyUsed,
  };
  const tickUsed = { cheap: 0, heavy: 0 };
  const planned: PlannedRefresh[] = [];

  const due = input.jobs
    .filter(
      (job) =>
        job.units > 0 && (job.ageMs == null || job.ageMs >= job.minIntervalMs)
    )
    .sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key));

  for (const job of due) {
    const next = used[job.quota] + job.units;
    const nextTick = tickUsed[job.quota] + job.units;
    if (next > soft[job.quota]) continue;
    if (nextTick > tick[job.quota]) continue;
    used[job.quota] = next;
    tickUsed[job.quota] = nextTick;
    planned.push({
      key: job.key,
      kind: job.kind,
      quota: job.quota,
      units: job.units,
    });
  }

  return planned;
}
