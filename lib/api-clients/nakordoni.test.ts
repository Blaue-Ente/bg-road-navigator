import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureNakordoniMeteredForTests,
  nakordoniMeteredFetch,
  NAKORDONI_MIN_GAP_MS,
  resetNakordoniMeteredForTests,
  seedNakordoniStaleCacheForTests,
} from "@/lib/api-clients/nakordoni";

describe("nakordoniMeteredFetch", () => {
  beforeEach(() => {
    resetNakordoniMeteredForTests();
    vi.stubEnv("NAKORDONI_API_KEY", "test-key");
  });

  afterEach(() => {
    resetNakordoniMeteredForTests();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("never allows more than 2 calls in any 1000ms window under 20 concurrent callers", async () => {
    vi.useFakeTimers();
    let now = 0;
    const callTimes: number[] = [];
    const fetcher = vi.fn(async () => {
      callTimes.push(now);
      return new Response(JSON.stringify({ ok: true, data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    configureNakordoniMeteredForTests({
      now: () => now,
      sleep: (ms) => {
        now += ms;
        return Promise.resolve();
      },
      fetcher: fetcher as typeof fetch,
      reserveGlobalSlot: async (at) => at,
    });

    const paths = Array.from({ length: 20 }, (_, i) => `/api/v1/data/queue?ppid=id_${i}`);
    const pending = paths.map((path) => nakordoniMeteredFetch(path));
    await vi.runAllTimersAsync();
    await Promise.all(pending);

    expect(fetcher).toHaveBeenCalledTimes(20);
    for (let start = 0; start <= now - 1000; start += 50) {
      const inWindow = callTimes.filter(
        (t) => t >= start && t < start + 1000
      ).length;
      expect(inWindow).toBeLessThanOrEqual(2);
    }
    for (let i = 1; i < callTimes.length; i++) {
      expect(callTimes[i] - callTimes[i - 1]).toBeGreaterThanOrEqual(
        NAKORDONI_MIN_GAP_MS
      );
    }
  });

  it("dedupes identical in-flight paths", async () => {
    let resolves: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      resolves = resolve;
    });
    const fetcher = vi.fn(async () => {
      await gate;
      return new Response(JSON.stringify({ ok: true, v: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    configureNakordoniMeteredForTests({
      reserveGlobalSlot: async (at) => at,
      fetcher: fetcher as typeof fetch,
    });

    const path = "/api/v1/data/multi?ppids=id_1";
    const a = nakordoniMeteredFetch(path);
    const b = nakordoniMeteredFetch(path);
    expect(fetcher).toHaveBeenCalledTimes(0);
    resolves?.();
    const [ra, rb] = await Promise.all([a, b]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(ra.json).toEqual(rb.json);
  });

  it("falls back to per-instance throttle when global slot reservation fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const callTimes: number[] = [];
    let now = 0;
    const fetcher = vi.fn(async () => {
      callTimes.push(now);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    configureNakordoniMeteredForTests({
      now: () => now,
      sleep: (ms) => {
        now += ms;
        return Promise.resolve();
      },
      fetcher: fetcher as typeof fetch,
      reserveGlobalSlot: async () => {
        throw new Error("relation nakordoni_rate does not exist");
      },
    });

    await nakordoniMeteredFetch("/api/v1/data/queue?ppid=id_a");
    await nakordoniMeteredFetch("/api/v1/data/queue?ppid=id_b");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("per-instance throttle only");
    expect(callTimes.length).toBe(2);
    expect(callTimes[1]! - callTimes[0]!).toBeGreaterThanOrEqual(
      NAKORDONI_MIN_GAP_MS
    );
    warn.mockRestore();
  });

  it("backs off on 429 using Retry-After then serves stale cache", async () => {
    let now = 0;
    const sleeps: number[] = [];
    let call = 0;
    const path = "/api/v1/data/day-stats?ppid=id_stale";

    seedNakordoniStaleCacheForTests(path, { ok: true, cached: true });

    const rateFetcher = vi.fn(async () => {
      call += 1;
      return new Response("rate limited", {
        status: 429,
        headers: { "Retry-After": "1" },
      });
    });

    configureNakordoniMeteredForTests({
      now: () => now,
      sleep: async (ms) => {
        sleeps.push(ms);
        now += ms;
      },
      fetcher: rateFetcher as typeof fetch,
      reserveGlobalSlot: async (at) => at,
    });

    const result = await nakordoniMeteredFetch(path);
    expect(call).toBe(3);
    expect(sleeps.filter((ms) => ms >= 1000).length).toBeGreaterThanOrEqual(1);
    expect(result.stale).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.json).toEqual({ ok: true, cached: true });
  });
});