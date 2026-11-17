import { beforeEach, describe, expect, it } from "vitest";
import {
  cachedValue,
  clearSharedCacheForTests,
  minutesFromEnv,
  snapToGrid,
} from "@/lib/cache/shared-cache";

beforeEach(() => clearSharedCacheForTests());

describe("cachedValue", () => {
  it("calls the provider once, then serves memory until it expires", async () => {
    let calls = 0;
    const load = async () => {
      calls += 1;
      return { n: calls };
    };
    const base = { key: "a", kind: "t", ttlMs: 1000, persist: false, load };
    expect(await cachedValue({ ...base, now: 0 })).toEqual({ value: { n: 1 }, source: "fresh" });
    expect(await cachedValue({ ...base, now: 500 })).toEqual({ value: { n: 1 }, source: "memory" });
    expect((await cachedValue({ ...base, now: 1500 })).value).toEqual({ n: 2 });
    expect(calls).toBe(2);
  });

  it("never keeps a failure", async () => {
    let calls = 0;
    const load = async () => {
      calls += 1;
      return calls === 1 ? null : "ok";
    };
    const base = { key: "b", kind: "t", ttlMs: 1000, persist: false, load, now: 0 };
    expect((await cachedValue(base)).value).toBeNull();
    expect((await cachedValue(base)).value).toBe("ok");
  });

  it("lets simultaneous identical requests share one call", async () => {
    let calls = 0;
    const load = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return "x";
    };
    const base = { key: "c", kind: "t", ttlMs: 1000, persist: false, load, now: 0 };
    const results = await Promise.all([cachedValue(base), cachedValue(base), cachedValue(base)]);
    expect(results.map((r) => r.value)).toEqual(["x", "x", "x"]);
    expect(calls).toBe(1);
  });

  it("switches off with a zero lifetime", async () => {
    let calls = 0;
    const load = async () => ++calls;
    const base = { key: "d", kind: "t", ttlMs: 0, persist: false, load };
    expect((await cachedValue(base)).source).toBe("off");
    await cachedValue(base);
    expect(calls).toBe(2);
  });
});

describe("helpers", () => {
  it("snaps coordinates to a grid", () => {
    expect(snapToGrid(43.3209, 0.05)).toBeCloseTo(43.3, 5);
    expect(snapToGrid(21.9, 0.05)).toBeCloseTo(21.9, 5);
  });
  it("reads minutes from the environment", () => {
    expect(minutesFromEnv(undefined, 60)).toBe(60);
    expect(minutesFromEnv("15", 60)).toBe(15);
    expect(minutesFromEnv("0", 60)).toBe(0);
    expect(minutesFromEnv("99999", 60)).toBe(1440);
    expect(minutesFromEnv("abc", 60)).toBe(60);
  });
});
