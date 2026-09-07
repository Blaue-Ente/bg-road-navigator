/**
 * In-memory sliding window limiter.
 * Per-instance on serverless (not global) — still blocks naive abuse.
 */

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 12_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_BUCKETS / 2) break;
  }
  if (buckets.size >= MAX_BUCKETS) {
    const first = buckets.keys().next().value;
    if (first) buckets.delete(first);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  prune(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "unknown";
}

export function limitForPath(pathname: string): {
  limit: number;
  windowMs: number;
} {
  const windowMs = 60_000;
  if (pathname === "/api/health" || pathname === "/api/config/status") {
    return { limit: 120, windowMs };
  }
  if (pathname === "/api/trips/plan") return { limit: 8, windowMs };
  if (pathname === "/api/fuel" || pathname === "/api/traffic") {
    return { limit: 20, windowMs };
  }
  if (pathname === "/api/route") return { limit: 20, windowMs };
  if (pathname === "/api/places/search") return { limit: 30, windowMs };
  if (pathname.startsWith("/api/community")) return { limit: 30, windowMs };
  if (pathname.startsWith("/api/emergency")) return { limit: 20, windowMs };
  return { limit: 60, windowMs };
}

/** Reset helper for tests. */
export function resetRateLimitForTests() {
  buckets.clear();
}
