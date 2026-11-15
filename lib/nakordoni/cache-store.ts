import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured, normalizeDbError } from "@/lib/db";
import {
  nakordoniBudget,
  nakordoniCache,
  osmQueryCache,
} from "@/lib/db/schema";

export interface CacheRow {
  key: string;
  payload: unknown;
  fetchedAt: Date;
  expiresAt: Date;
  observedAt: Date | null;
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export async function readNakordoniCache(keys: string[]): Promise<CacheRow[]> {
  if (!isDatabaseConfigured() || keys.length === 0) return [];
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(nakordoniCache)
      .where(inArray(nakordoniCache.cacheKey, keys));
    return rows.map((row) => ({
      key: row.cacheKey,
      payload: row.payload,
      fetchedAt: asDate(row.fetchedAt),
      expiresAt: asDate(row.expiresAt),
      observedAt: row.observedAt ? asDate(row.observedAt) : null,
    }));
  } catch (error) {
    throw normalizeDbError(error);
  }
}

export async function writeNakordoniCache(input: {
  key: string;
  kind: string;
  payload: unknown;
  fetchedAt: Date;
  expiresAt: Date;
  observedAt: Date | null;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(nakordoniCache)
    .values({
      cacheKey: input.key,
      kind: input.kind,
      payload: input.payload,
      fetchedAt: input.fetchedAt,
      expiresAt: input.expiresAt,
      observedAt: input.observedAt,
    })
    .onConflictDoUpdate({
      target: nakordoniCache.cacheKey,
      set: {
        kind: input.kind,
        payload: input.payload,
        fetchedAt: input.fetchedAt,
        expiresAt: input.expiresAt,
        observedAt: input.observedAt,
      },
    });
}

export async function readNakordoniBudget(day: string): Promise<{
  cheap: number;
  heavy: number;
}> {
  if (!isDatabaseConfigured()) return { cheap: 0, heavy: 0 };
  const db = getDb();
  const rows = await db
    .select()
    .from(nakordoniBudget)
    .where(eq(nakordoniBudget.day, day))
    .limit(1);
  return {
    cheap: rows[0]?.cheapCalls ?? 0,
    heavy: rows[0]?.heavyCalls ?? 0,
  };
}

export async function addNakordoniBudget(
  day: string,
  cheap: number,
  heavy: number
): Promise<void> {
  if (cheap <= 0 && heavy <= 0) return;
  const db = getDb();
  await db
    .insert(nakordoniBudget)
    .values({ day, cheapCalls: cheap, heavyCalls: heavy })
    .onConflictDoUpdate({
      target: nakordoniBudget.day,
      set: {
        cheapCalls: sql`${nakordoniBudget.cheapCalls} + ${cheap}`,
        heavyCalls: sql`${nakordoniBudget.heavyCalls} + ${heavy}`,
        updatedAt: new Date(),
      },
    });
}

const memoryOsm = new Map<string, { payload: unknown; expiresAt: number }>();

export async function readOsmCache(
  key: string,
  now = Date.now()
): Promise<unknown | null> {
  const memory = memoryOsm.get(key);
  if (memory && memory.expiresAt > now) return memory.payload;
  if (!isDatabaseConfigured()) return null;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(osmQueryCache)
      .where(and(eq(osmQueryCache.cacheKey, key)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (asDate(row.expiresAt).getTime() <= now) return null;
    memoryOsm.set(key, {
      payload: row.payload,
      expiresAt: asDate(row.expiresAt).getTime(),
    });
    return row.payload;
  } catch {
    return null;
  }
}

export async function writeOsmCache(input: {
  key: string;
  kind: string;
  payload: unknown;
  ttlMs: number;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + input.ttlMs);
  memoryOsm.set(input.key, {
    payload: input.payload,
    expiresAt: expiresAt.getTime(),
  });
  if (!isDatabaseConfigured()) return;
  try {
    const db = getDb();
    await db
      .insert(osmQueryCache)
      .values({
        cacheKey: input.key,
        kind: input.kind,
        payload: input.payload,
        fetchedAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: osmQueryCache.cacheKey,
        set: {
          kind: input.kind,
          payload: input.payload,
          fetchedAt: now,
          expiresAt,
        },
      });
  } catch {
    // The in-memory copy still serves this process.
  }
}
