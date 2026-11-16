/**
 * Nakordoni.eu Border Queue API
 * Explorer plan: 2 req/s, daily quotas — https://nakordoni.eu/en/developers
 *
 * Every live HTTP call goes through {@link nakordoniMeteredFetch}: per-instance
 * serialization, cross-instance slot reservation (Neon), in-flight dedupe,
 * 15-minute response cache, and 429 backoff.
 */

import {
  getNakordoniPpid,
  NAKORDONI_BY_CROSSING,
  NAKORDONI_PPIDS,
} from "@/lib/constants/nakordoni-checkpoints";
import { getDb, isDatabaseConfigured, normalizeDbError } from "@/lib/db";
import { nakordoniRate } from "@/lib/db/schema";
import { readNakordoniCache } from "@/lib/nakordoni/cache-store";
import { eq, sql } from "drizzle-orm";

export const NAKORDONI_DATA_ROOT = "https://nakordoni.eu";

/** ~1.6 req/s per instance — under the 2 req/s hard limit with headroom. */
export const NAKORDONI_MIN_GAP_MS = 600;
export const NAKORDONI_RESPONSE_CACHE_MS = 15 * 60 * 1000;
const MAX_429_RETRIES = 2;
const ADVISORY_LOCK_KEY = 915_001;

export interface NakordoniMeteredResult {
  ok: boolean;
  status: number;
  json: unknown;
  fromCache?: boolean;
  stale?: boolean;
}

interface NakordoniQueueSnapshot {
  queue_now?: number;
  wait_min?: number;
  wait_status?: string;
  trend?: string;
}

interface NakordoniQueueResponse {
  ok: boolean;
  data?: {
    ppid?: string;
    snapshot?: NakordoniQueueSnapshot;
    queue_now?: number;
    wait_min?: number;
  };
}

interface NakordoniMultiItem {
  ppid: string;
  snapshot?: NakordoniQueueSnapshot;
  queue_now?: number;
  wait_min?: number;
}

interface NakordoniMultiResponse {
  ok: boolean;
  data?: NakordoniMultiItem[] | { items?: NakordoniMultiItem[] };
}

export interface NakordoniQueueData {
  ppid: string;
  crossingId: string;
  waitMinutes: number;
  queueLength: number;
  status?: string;
  updatedAt: string;
}

type SleepFn = (ms: number) => Promise<void>;
type NowFn = () => number;

interface MeteredDeps {
  now: NowFn;
  sleep: SleepFn;
  fetcher: typeof fetch;
  reserveGlobalSlot: (atMs: number) => Promise<number>;
}

const memoryResponseCache = new Map<
  string,
  { json: unknown; expiresAt: number; staleJson: unknown }
>();
const inFlight = new Map<string, Promise<NakordoniMeteredResult>>();

let chain: Promise<unknown> = Promise.resolve();
let lastLocalFireMs = 0;

let deps: MeteredDeps = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  fetcher: fetch,
  reserveGlobalSlot: reserveNakordoniSlotInDb,
};

/** Test-only: swap clock, sleep, fetch, and global slot reservation. */
export function configureNakordoniMeteredForTests(
  partial: Partial<MeteredDeps>
): void {
  deps = { ...deps, ...partial };
}

export function resetNakordoniMeteredForTests(): void {
  memoryResponseCache.clear();
  inFlight.clear();
  chain = Promise.resolve();
  lastLocalFireMs = 0;
  deps = {
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    fetcher: fetch,
    reserveGlobalSlot: reserveNakordoniSlotInDb,
  };
}

/** Seeds an expired cache row so 429 retry exhaustion can fall back to stale data. */
export function seedNakordoniStaleCacheForTests(
  path: string,
  json: unknown
): void {
  memoryResponseCache.set(path, {
    json,
    expiresAt: 0,
    staleJson: json,
  });
}

function getApiKey(): string | undefined {
  return process.env.NAKORDONI_API_KEY?.trim();
}

function cacheGet(path: string, now: number): NakordoniMeteredResult | null {
  const row = memoryResponseCache.get(path);
  if (!row) return null;
  if (row.expiresAt > now) {
    return {
      ok: true,
      status: 200,
      json: row.json,
      fromCache: true,
    };
  }
  return null;
}

function cachePut(path: string, json: unknown, now: number): void {
  const expiresAt = now + NAKORDONI_RESPONSE_CACHE_MS;
  const prev = memoryResponseCache.get(path);
  memoryResponseCache.set(path, {
    json,
    expiresAt,
    staleJson: prev?.json ?? json,
  });
}

function staleGet(path: string): unknown | null {
  return memoryResponseCache.get(path)?.staleJson ?? null;
}

function parseRetryAfterMs(header: string | null): number | null {
  if (!header?.trim()) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000);
  }
  const date = Date.parse(header);
  if (!Number.isFinite(date)) return null;
  return Math.max(0, date - deps.now());
}

async function reserveNakordoniSlotInDb(nowMs: number): Promise<number> {
  if (!isDatabaseConfigured()) return nowMs;
  try {
    const db = getDb();
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(${ADVISORY_LOCK_KEY})`
      );
      const rows = await tx
        .select()
        .from(nakordoniRate)
        .where(eq(nakordoniRate.id, 1))
        .limit(1);
      const currentNext = rows[0]?.nextSlotMs ?? 0;
      const fireAt = Math.max(nowMs, currentNext);
      const nextSlot = fireAt + NAKORDONI_MIN_GAP_MS;
      if (rows.length === 0) {
        await tx.insert(nakordoniRate).values({ id: 1, nextSlotMs: nextSlot });
      } else {
        await tx
          .update(nakordoniRate)
          .set({ nextSlotMs: nextSlot })
          .where(eq(nakordoniRate.id, 1));
      }
      return fireAt;
    });
  } catch (error) {
    const normalized = normalizeDbError(error);
    if (normalized.name === "MigrationRequiredError") {
      return nowMs;
    }
    return nowMs;
  }
}

async function paceBeforeRequest(): Promise<void> {
  const now = deps.now();
  const globalFireAt = await deps.reserveGlobalSlot(now);
  const localGap = Math.max(0, lastLocalFireMs + NAKORDONI_MIN_GAP_MS - now);
  const globalGap = Math.max(0, globalFireAt - now);
  const wait = Math.max(localGap, globalGap);
  if (wait > 0) await deps.sleep(wait);
  lastLocalFireMs = deps.now();
}

async function httpGetOnce(
  url: string,
  apiKey: string
): Promise<NakordoniMeteredResult & { retryAfterMs: number | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await deps.fetcher(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as unknown;
    const bodyOk =
      Boolean(json) &&
      typeof json === "object" &&
      (json as { ok?: boolean }).ok !== false;
    return {
      ok: response.ok && bodyOk,
      status: response.status,
      json,
      retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
    };
  } catch {
    return { ok: false, status: 0, json: null, retryAfterMs: null };
  } finally {
    clearTimeout(timer);
  }
}

async function httpGetWith429Backoff(
  path: string,
  apiKey: string
): Promise<NakordoniMeteredResult> {
  const url = path.startsWith("http")
    ? path
    : `${NAKORDONI_DATA_ROOT}${path.startsWith("/") ? path : `/${path}`}`;
  let backoffMs = 2000;
  for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
    await paceBeforeRequest();
    const response = await httpGetOnce(url, apiKey);
    if (response.status !== 429 || attempt >= MAX_429_RETRIES) {
      const { retryAfterMs: _r, ...rest } = response;
      void _r;
      return rest;
    }
    const waitMs = response.retryAfterMs ?? backoffMs;
    await deps.sleep(waitMs);
    backoffMs *= 2;
  }
  const stale = staleGet(path);
  if (stale != null) {
    return { ok: true, status: 200, json: stale, stale: true };
  }
  return { ok: false, status: 429, json: null };
}

async function runMetered(path: string): Promise<NakordoniMeteredResult> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, status: 0, json: null };

  const now = deps.now();
  const cached = cacheGet(path, now);
  if (cached) return cached;

  const result = await httpGetWith429Backoff(path, apiKey);
  if (result.ok && result.json != null && !result.stale) {
    cachePut(path, result.json, deps.now());
  }
  if (!result.ok && result.status === 429) {
    const stale = staleGet(path);
    if (stale != null) {
      return { ok: true, status: 200, json: stale, stale: true };
    }
  }
  return result;
}

function enqueueMetered(path: string): Promise<NakordoniMeteredResult> {
  const existing = inFlight.get(path);
  if (existing) return existing;

  const job = chain.then(() => runMetered(path));
  chain = job.catch(() => {});
  inFlight.set(path, job);
  void job.finally(() => {
    if (inFlight.get(path) === job) inFlight.delete(path);
  });
  return job;
}

/** Metered GET for any Nakordoni API path (v1/v4), shared by cron and borders. */
export function nakordoniMeteredFetch(
  path: string
): Promise<NakordoniMeteredResult> {
  return enqueueMetered(path);
}

function extractWait(
  item: NakordoniMultiItem | NakordoniQueueResponse["data"]
) {
  if (!item) return { waitMinutes: 0, queueLength: 0, status: undefined };

  const snapshot = "snapshot" in item ? item.snapshot : undefined;
  const waitMinutes = Math.round(snapshot?.wait_min ?? item.wait_min ?? 0);
  const queueLength = Math.round(
    snapshot?.queue_now ?? ("queue_now" in item ? item.queue_now : 0) ?? 0
  );

  return {
    waitMinutes,
    queueLength,
    status: snapshot?.wait_status,
  };
}

function mapMultiPayload(
  payload: NakordoniMultiResponse,
  updatedAt: string
): NakordoniQueueData[] {
  if (!payload?.ok || !payload.data) return [];
  const items = Array.isArray(payload.data)
    ? payload.data
    : (payload.data.items ?? []);
  const crossingByPpid = Object.fromEntries(
    Object.entries(NAKORDONI_BY_CROSSING).map(([id, cfg]) => [cfg.ppid, id])
  );
  return items.map((item) => {
    const { waitMinutes, queueLength, status } = extractWait(item);
    return {
      ppid: item.ppid,
      crossingId: crossingByPpid[item.ppid] ?? item.ppid,
      waitMinutes,
      queueLength,
      status,
      updatedAt,
    };
  });
}

function liveRowToQueue(
  ppid: string,
  payload: unknown,
  fetchedAt: Date
): NakordoniQueueData | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as {
    wait_min?: number;
    queue_now?: number;
    wait_status?: string;
  };
  const crossingByPpid = Object.fromEntries(
    Object.entries(NAKORDONI_BY_CROSSING).map(([id, cfg]) => [cfg.ppid, id])
  );
  return {
    ppid,
    crossingId: crossingByPpid[ppid] ?? ppid,
    waitMinutes: Math.round(record.wait_min ?? 0),
    queueLength: Math.round(record.queue_now ?? 0),
    status: record.wait_status,
    updatedAt: fetchedAt.toISOString(),
  };
}

const LIVE_CACHE_MAX_AGE_MS = NAKORDONI_RESPONSE_CACHE_MS;

/** Cache-first live queues; at most one throttled multi call on miss. */
export async function fetchNakordoniQueues(
  now = new Date()
): Promise<NakordoniQueueData[]> {
  const ppids = [...NAKORDONI_PPIDS];
  const keys = ppids.map((ppid) => `live:${ppid}`);
  let fromDb: NakordoniQueueData[] = [];
  if (isDatabaseConfigured() && keys.length > 0) {
    try {
      const rows = await readNakordoniCache(keys);
      const freshBefore = now.getTime() - LIVE_CACHE_MAX_AGE_MS;
      fromDb = rows
        .filter((row) => row.fetchedAt.getTime() >= freshBefore)
        .map((row) => {
          const ppid = row.key.slice("live:".length);
          return liveRowToQueue(ppid, row.payload, row.fetchedAt);
        })
        .filter((row): row is NakordoniQueueData => row != null);
    } catch {
      fromDb = [];
    }
  }

  const have = new Set(fromDb.map((row) => row.ppid));
  const missing = ppids.filter((ppid) => !have.has(ppid));
  if (missing.length === 0 && fromDb.length > 0) {
    return fromDb;
  }

  const ppidList = missing.length > 0 ? missing.join(",") : ppids.join(",");
  const path = `/api/v1/data/multi?ppids=${ppidList}&include=queue&lang=bg`;
  const payload = await nakordoniMeteredFetch(path);
  if (!payload.ok || !payload.json) {
    return fromDb;
  }
  const live = mapMultiPayload(
    payload.json as NakordoniMultiResponse,
    now.toISOString()
  );
  const merged = new Map(fromDb.map((row) => [row.ppid, row]));
  for (const row of live) merged.set(row.ppid, row);
  return [...merged.values()];
}

export async function fetchNakordoniQueue(
  crossingId: string
): Promise<NakordoniQueueData | null> {
  const ppid = getNakordoniPpid(crossingId);
  if (!ppid) return null;

  const now = new Date();
  if (isDatabaseConfigured()) {
    try {
      const rows = await readNakordoniCache([`live:${ppid}`]);
      const row = rows[0];
      if (row && row.fetchedAt.getTime() >= now.getTime() - LIVE_CACHE_MAX_AGE_MS) {
        return liveRowToQueue(ppid, row.payload, row.fetchedAt);
      }
    } catch {
      // fall through to live
    }
  }

  const path = `/api/v1/data/queue?ppid=${ppid}&lang=bg`;
  const payload = await nakordoniMeteredFetch(path);
  if (!payload.ok || !payload.json) return null;

  const body = payload.json as NakordoniQueueResponse;
  if (!body?.ok || !body.data) return null;

  const { waitMinutes, queueLength, status } = extractWait(body.data);

  return {
    ppid,
    crossingId,
    waitMinutes,
    queueLength,
    status,
    updatedAt: now.toISOString(),
  };
}