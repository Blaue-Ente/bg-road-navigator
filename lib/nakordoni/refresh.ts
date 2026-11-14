import {
  isDatabaseConfigured,
  normalizeDbError,
  MigrationRequiredError,
} from "@/lib/db";
import {
  addNakordoniBudget,
  readNakordoniBudget,
  readNakordoniCache,
  writeNakordoniCache,
} from "@/lib/nakordoni/cache-store";
import { nakordoniGet, nakordoniPath } from "@/lib/nakordoni/client";
import {
  BORDER_V4_PAIRS,
  corridorCheckpoints,
  DIRECTORY_COUNTRIES,
  filterLicensedPpids,
} from "@/lib/nakordoni/corridor";
import {
  parseBorderQueues,
  parseDirectoryOrigins,
  parseMultiQueues,
} from "@/lib/nakordoni/parse";
import {
  buildCorridorRefreshJobs,
  NAKORDONI_HARD_CAP,
  NAKORDONI_SOFT_CAP,
  NAKORDONI_TICK_CAP,
  planNakordoniRefresh,
  type PlannedRefresh,
  type RefreshJob,
} from "@/lib/planner/nakordoni-budget";

const CACHE_TTL_MS = {
  directory: 25 * 24 * 60 * 60 * 1000,
  "day-stats": 23 * 60 * 60 * 1000,
  queue: 23 * 60 * 60 * 1000,
  forecast: 23 * 60 * 60 * 1000,
  border: 23 * 60 * 60 * 1000,
} as const;

const PACE_MS = 600;
const RUN_BUDGET_MS = 45_000;

export interface RefreshReport {
  ok: boolean;
  skipped?: string;
  planned: number;
  fetched: number;
  failed: number;
  heavy_units: number;
  cheap_units: number;
  stopped_early: boolean;
}

export async function refreshNakordoniCache(
  now = new Date()
): Promise<RefreshReport> {
  if (!process.env.NAKORDONI_API_KEY?.trim()) {
    return emptyReport("no_api_key");
  }
  if (!isDatabaseConfigured()) return emptyReport("no_database");

  try {
    const day = now.toISOString().slice(0, 10);
    const ppids = await licensedPpids();
    const jobs = withAges(
      buildCorridorRefreshJobs({
        ppids,
        borderPairs: [...BORDER_V4_PAIRS],
        directoryCountries: [...DIRECTORY_COUNTRIES],
      }),
      await readNakordoniCache(
        buildCorridorRefreshJobs({
          ppids,
          borderPairs: [...BORDER_V4_PAIRS],
          directoryCountries: [...DIRECTORY_COUNTRIES],
        }).map((job) => job.key)
      ),
      now
    );
    const budget = await readNakordoniBudget(day);
    const planned = planNakordoniRefresh({
      jobs,
      budget: {
        cheapUsed: budget.cheap,
        heavyUsed: budget.heavy,
        ...spreadCaps(),
      },
      maxUnitsThisTick: NAKORDONI_TICK_CAP,
    });

    const started = Date.now();
    let fetched = 0;
    let failed = 0;
    let heavy = 0;
    let cheap = 0;
    let stopped = false;
    let first = true;

    for (const call of planned) {
      if (Date.now() - started > RUN_BUDGET_MS) {
        stopped = true;
        break;
      }
      if (!first) await sleep(PACE_MS);
      first = false;
      const outcome = await fetchOne(call, now);
      if (outcome === "ok") {
        fetched += 1;
        if (call.quota === "heavy") heavy += call.units;
        else cheap += call.units;
        await addNakordoniBudget(
          day,
          call.quota === "cheap" ? call.units : 0,
          call.quota === "heavy" ? call.units : 0
        );
      } else if (outcome === "quota") {
        failed += 1;
        stopped = true;
        break;
      } else {
        failed += 1;
      }
    }

    return {
      ok: true,
      planned: planned.length,
      fetched,
      failed,
      heavy_units: heavy,
      cheap_units: cheap,
      stopped_early: stopped,
    };
  } catch (error) {
    const normalized = normalizeDbError(error);
    if (normalized instanceof MigrationRequiredError) {
      return emptyReport("migration_required");
    }
    throw normalized;
  }
}

async function licensedPpids(): Promise<string[]> {
  const base = corridorCheckpoints().map((row) => row.ppid);
  const directories = await readNakordoniCache(
    DIRECTORY_COUNTRIES.map((country) => `directory:${country}`)
  );
  const origins = directories.flatMap((row) =>
    parseDirectoryOrigins(row.payload)
  );
  return filterLicensedPpids(base, origins);
}

function withAges(
  jobs: RefreshJob[],
  rows: Array<{ key: string; fetchedAt: Date }>,
  now: Date
): RefreshJob[] {
  const ages = new Map(
    rows.map((row) => [row.key, now.getTime() - row.fetchedAt.getTime()])
  );
  return jobs.map((job) => ({
    ...job,
    ageMs: ages.has(job.key) ? ages.get(job.key)! : null,
  }));
}

async function fetchOne(
  call: PlannedRefresh,
  now: Date
): Promise<"ok" | "fail" | "quota"> {
  const path = nakordoniPath(call.kind, call.key);
  if (!path) return "fail";
  const result = await nakordoniGet(path);
  if (result.status === 429) return "quota";
  if (!result.ok) return "fail";
  const ttl =
    CACHE_TTL_MS[call.kind as keyof typeof CACHE_TTL_MS] ?? CACHE_TTL_MS.queue;
  const expiresAt = new Date(now.getTime() + ttl);
  await writeNakordoniCache({
    key: call.key,
    kind: call.kind,
    payload: result.json,
    fetchedAt: now,
    expiresAt,
    observedAt: null,
  });
  if (call.kind === "queue") {
    for (const row of parseMultiQueues(result.json)) {
      await writeNakordoniCache({
        key: `live:${row.ppid}`,
        kind: "live",
        payload: row,
        fetchedAt: now,
        expiresAt,
        observedAt: row.observedAt ? new Date(row.observedAt) : null,
      });
    }
  }
  if (call.kind === "border") {
    for (const row of parseBorderQueues(result.json)) {
      await writeNakordoniCache({
        key: `border-live:${row.ppid}`,
        kind: "border-live",
        payload: row,
        fetchedAt: now,
        expiresAt,
        observedAt: row.observedAt ? new Date(row.observedAt) : null,
      });
    }
  }
  return "ok";
}

function spreadCaps() {
  return {
    cheapSoftCap: NAKORDONI_SOFT_CAP.cheap,
    heavySoftCap: NAKORDONI_SOFT_CAP.heavy,
    cheapHardCap: NAKORDONI_HARD_CAP.cheap,
    heavyHardCap: NAKORDONI_HARD_CAP.heavy,
  };
}

function emptyReport(skipped: string): RefreshReport {
  return {
    ok: false,
    skipped,
    planned: 0,
    fetched: 0,
    failed: 0,
    heavy_units: 0,
    cheap_units: 0,
    stopped_early: false,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
