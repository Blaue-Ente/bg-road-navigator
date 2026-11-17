import {
  clearOsmMemoryCacheForTests,
  readOsmCache,
  writeOsmCache,
} from "@/lib/nakordoni/cache-store";

/**
 * One cache for paid or limited provider calls.
 *
 * - `persist: true` keeps the answer in Neon (table `osm_query_cache`, already
 *   created by drizzle/0002) so every server and every driver on a similar route
 *   shares it. Use it only for data whose terms allow keeping it (open data,
 *   our own service, or a partner that agreed to it).
 * - `persist: false` keeps it only in this server's memory for a short time.
 *
 * Failures are never cached: `load` returns null for them. Identical requests
 * that arrive together share one call.
 */
export type CacheSource = "memory" | "database" | "fresh" | "off";

const MEMORY_LIMIT = 500;
const memory = new Map<string, { value: unknown; expiresAt: number }>();
const inflight = new Map<string, Promise<unknown>>();

export function clearSharedCacheForTests(): void {
  memory.clear();
  inflight.clear();
  clearOsmMemoryCacheForTests();
}

/** Round a coordinate to a grid so nearby drivers share one cache cell. */
export function snapToGrid(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export async function cachedValue<T>(options: {
  key: string;
  kind: string;
  ttlMs: number;
  persist: boolean;
  load: () => Promise<T | null>;
  now?: number;
}): Promise<{ value: T | null; source: CacheSource }> {
  const now = options.now ?? Date.now();
  if (options.ttlMs <= 0) {
    return { value: await options.load(), source: "off" };
  }

  const local = memory.get(options.key);
  if (local && local.expiresAt > now) {
    return { value: local.value as T, source: "memory" };
  }

  if (options.persist) {
    const stored = await readOsmCache(options.key, now);
    if (stored !== null) return { value: stored as T, source: "database" };
  }

  let pending = inflight.get(options.key) as Promise<T | null> | undefined;
  if (!pending) {
    pending = options
      .load()
      .then(async (value) => {
        if (value !== null) {
          if (memory.size >= MEMORY_LIMIT) {
            const oldest = memory.keys().next().value;
            if (oldest !== undefined) memory.delete(oldest);
          }
          memory.set(options.key, { value, expiresAt: now + options.ttlMs });
          if (options.persist) {
            await writeOsmCache({
              key: options.key,
              kind: options.kind,
              payload: value,
              ttlMs: options.ttlMs,
              now: new Date(now),
            });
          }
        }
        return value;
      })
      .finally(() => inflight.delete(options.key));
    inflight.set(options.key, pending);
  }
  return { value: await pending, source: "fresh" };
}

/** A number (minutes or seconds) from an environment value, within [0, max]; `0` switches caching off. */
export function minutesFromEnv(
  value: string | undefined,
  fallback: number,
  max = 24 * 60
): number {
  const parsed = Number.parseFloat(value ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(0, parsed));
}
