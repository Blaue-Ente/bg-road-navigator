import {
  isDatabaseConfigured,
  normalizeDbError,
  MigrationRequiredError,
} from "@/lib/db";
import {
  addNakordoniBudget,
  capExpiryToUpdate,
  purgeExpiredNakordoniCache,
  readNakordoniBudget,
  readNakordoniCache,
  writeNakordoniCache,
} from "@/lib/nakordoni/cache-store";
import {
  nakordoniGet,
  nakordoniPath,
  type NakordoniCallResult,
} from "@/lib/nakordoni/client";
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
  applyCacheAge,
  buildCorridorRefreshJobs,
  isBackoffStatus,
  NAKORDONI_HARD_CAP,
  NAKORDONI_NEGATIVE_TTL_MS,
  NAKORDONI_SOFT_CAP,
  NAKORDONI_TICK_CAP,
  negativeCachePayload,
  planNakordoniRefresh,
  type PlannedRefresh,
} from "@/lib/planner/nakordoni-budget";

const CACHE_TTL_MS = {
  directory: 25 * 24 * 60 * 60 * 1000,
  "day-stats": 23 * 60 * 60 * 1000,
  queue: 23 * 60 * 60 * 1000,
  forecast: 23 * 60 * 60 * 1000,
  border: 23 * 60 * 60 * 1000,
} as const;

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
  /** HTTP status → how many calls failed with it. Absent statuses were not seen. */
  errors_by_status: Record<string, number>;
}

export interface NakordoniRefreshDeps {
  apiKey?: string | null;
  databaseConfigured?: boolean;
  get?: (path: string) => Promise<NakordoniCallResult>;
  readCache?: (
    keys: string[]
  ) => Promise<Array<{ key: string; payload: unknown; fetchedAt: Date }>>;
  writeCache?: (input: {
    key: string;
    kind: string;
    payload: unknown;
    fetchedAt: Date;
    expiresAt: Date;
    observedAt: Date | null;
  }) => Promise<void>;
  purgeExpired?: (now: Date) => Promise<number>;
  readBudget?: (day: string) => Promise<{ cheap: number; heavy: number }>;
  addBudget?: (day: string, cheap: number, heavy: number) => Promise<void>;
}

export async function refreshNakordoniCache(
  now = new Date(),
  deps: NakordoniRefreshDeps = {}
): Promise<RefreshReport> {
  const apiKey =
    deps.apiKey === undefined
      ? process.env.NAKORDONI_API_KEY?.trim()
      : deps.apiKey?.trim();
  if (!apiKey) return emptyReport("no_api_key");
  const databaseReady =
    deps.databaseConfigured ?? isDatabaseConfigured();
  if (!databaseReady) return emptyReport("no_database");
  const readCache = deps.readCache ?? readNakordoniCache;
  const writeCache = deps.writeCache ?? writeNakordoniCache;
  const readBudget = deps.readBudget ?? readNakordoniBudget;
  const addBudget = deps.addBudget ?? addNakordoniBudget;
  const get = deps.get ?? ((path: string) => nakordoniGet(path));
  const purgeExpired = deps.purgeExpired ?? purgeExpiredNakordoniCache;

  try {
    const day = now.toISOString().slice(0, 10);
    // Nothing is kept past its window (terms 4.1(d), 6.1).
    await purgeExpired(now);
    const ppids = await licensedPpids(readCache);
    const shopping = buildCorridorRefreshJobs({
      ppids,
      borderPairs: [...BORDER_V4_PAIRS],
      directoryCountries: [...DIRECTORY_COUNTRIES],
    });
    const cached = await readCache(shopping.map((job) => job.key));
    const jobs = shopping.map((job) =>
      applyCacheAge(
        job,
        cached.find((row) => row.key === job.key),
        now
      )
    );
    const budget = await readBudget(day);
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
    const errorsByStatus: Record<string, number> = {};

    for (const call of planned) {
      if (Date.now() - started > RUN_BUDGET_MS) {
        stopped = true;
        break;
      }
      const outcome = await fetchOne(call, now, get, writeCache);
      if (outcome.kind === "ok") {
        fetched += 1;
        if (call.quota === "heavy") heavy += call.units;
        else cheap += call.units;
        await addBudget(
          day,
          call.quota === "cheap" ? call.units : 0,
          call.quota === "heavy" ? call.units : 0
        );
      } else {
        failed += 1;
        noteStatus(errorsByStatus, outcome.status);
        if (outcome.kind === "quota") {
          stopped = true;
          break;
        }
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
      errors_by_status: errorsByStatus,
    };
  } catch (error) {
    const normalized = normalizeDbError(error);
    if (normalized instanceof MigrationRequiredError) {
      return emptyReport("migration_required");
    }
    throw normalized;
  }
}

async function licensedPpids(
  readCache: NakordoniRefreshDeps["readCache"]
): Promise<string[]> {
  const base = corridorCheckpoints().map((row) => row.ppid);
  const directories = await (readCache ?? readNakordoniCache)(
    DIRECTORY_COUNTRIES.map((country) => `directory:${country}`)
  );
  const origins = directories.flatMap((row) =>
    parseDirectoryOrigins(row.payload)
  );
  return filterLicensedPpids(base, origins);
}

async function fetchOne(
  call: PlannedRefresh,
  now: Date,
  get: (path: string) => Promise<NakordoniCallResult>,
  writeCache: NonNullable<NakordoniRefreshDeps["writeCache"]>
): Promise<{ kind: "ok" | "fail" | "quota"; status: number }> {
  const path = nakordoniPath(call.kind, call.key);
  if (!path) return { kind: "fail", status: 0 };
  const result = await get(path);
  if (result.status === 429) return { kind: "quota", status: 429 };
  if (!result.ok) {
    if (isBackoffStatus(result.status)) {
      await writeCache({
        key: call.key,
        kind: call.kind,
        payload: negativeCachePayload(result.status),
        fetchedAt: now,
        expiresAt: new Date(now.getTime() + NAKORDONI_NEGATIVE_TTL_MS),
        observedAt: null,
      });
    }
    return { kind: "fail", status: result.status };
  }
  const ttl =
    CACHE_TTL_MS[call.kind as keyof typeof CACHE_TTL_MS] ?? CACHE_TTL_MS.queue;
  const expiresAt = new Date(now.getTime() + ttl);
  // The raw answer goes no later than 24 h after the oldest updated_at in it.
  const batchRows =
    call.kind === "queue"
      ? parseMultiQueues(result.json)
      : call.kind === "border"
        ? parseBorderQueues(result.json)
        : [];
  const oldest = batchRows
    .map((row) => (row.observedAt ? new Date(row.observedAt) : null))
    .filter((d): d is Date => d != null && !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  await writeCache({
    key: call.key,
    kind: call.kind,
    payload: result.json,
    fetchedAt: now,
    expiresAt: capExpiryToUpdate(expiresAt, oldest ?? null),
    observedAt: oldest ?? null,
  });
  if (call.kind === "queue") {
    for (const row of parseMultiQueues(result.json)) {
      const observedAt = row.observedAt ? new Date(row.observedAt) : null;
      await writeCache({
        key: `live:${row.ppid}`,
        kind: "live",
        payload: row,
        fetchedAt: now,
        expiresAt: capExpiryToUpdate(expiresAt, observedAt),
        observedAt,
      });
    }
  }
  if (call.kind === "border") {
    for (const row of parseBorderQueues(result.json)) {
      const observedAt = row.observedAt ? new Date(row.observedAt) : null;
      await writeCache({
        key: `border-live:${row.ppid}`,
        kind: "border-live",
        payload: row,
        fetchedAt: now,
        expiresAt: capExpiryToUpdate(expiresAt, observedAt),
        observedAt,
      });
    }
  }
  return { kind: "ok", status: result.status };
}

function noteStatus(counts: Record<string, number>, status: number) {
  const key = String(status);
  counts[key] = (counts[key] ?? 0) + 1;
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
    errors_by_status: {},
  };
}

