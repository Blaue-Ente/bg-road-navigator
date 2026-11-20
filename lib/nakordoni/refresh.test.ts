import { describe, expect, it } from "vitest";
import { refreshNakordoniCache } from "@/lib/nakordoni/refresh";
import { isNegativeCachePayload } from "@/lib/planner/nakordoni-budget";

describe("Nakordoni refresh backoff", () => {
  it("does not plan RS/TR jobs, counts statuses, and skips a fresh 403", async () => {
    const store = new Map<
      string,
      { payload: unknown; fetchedAt: Date }
    >();
    const seen: string[] = [];
    const deps = {
      apiKey: "test-key",
      databaseConfigured: true,
      readCache: async (keys: string[]) =>
        keys.flatMap((key) => {
          const row = store.get(key);
          return row ? [{ key, payload: row.payload, fetchedAt: row.fetchedAt }] : [];
        }),
      writeCache: async (input: {
        key: string;
        payload: unknown;
        fetchedAt: Date;
      }) => {
        store.set(input.key, {
          payload: input.payload,
          fetchedAt: input.fetchedAt,
        });
      },
      readBudget: async () => ({ cheap: 0, heavy: 0 }),
      addBudget: async () => {},
      get: async (path: string) => {
        seen.push(path);
        if (path.includes("id_384") || path.includes("id_386") || path.includes("id_388") || path.includes("id_390")) {
          throw new Error(`unlicensed checkpoint requested: ${path}`);
        }
        if (path.includes("/border/12/13/") || path.includes("/border/12/14/")) {
          throw new Error(`unlicensed pair requested: ${path}`);
        }
        if (path.includes("day-stats") && path.includes("id_484")) {
          return { ok: false, status: 403, json: null };
        }
        if (path.includes("day-stats") && path.includes("id_292")) {
          return { ok: false, status: 500, json: null };
        }
        return { ok: true, status: 200, json: { ok: true, data: {} } };
      },
    };

    const first = await refreshNakordoniCache(
      new Date("2026-11-15T06:00:00.000Z"),
      deps
    );
    expect(first.errors_by_status).toEqual({ "403": 1, "500": 1 });
    expect(first.failed).toBe(2);
    expect(isNegativeCachePayload(store.get("day-stats:id_484")?.payload)).toBe(
      true
    );
    expect(store.has("day-stats:id_292")).toBe(false);

    seen.length = 0;
    await refreshNakordoniCache(new Date("2026-11-15T06:10:00.000Z"), deps);
    expect(
      seen.some((path) => path.includes("day-stats") && path.includes("id_484"))
    ).toBe(false);
    expect(
      seen.some((path) => path.includes("day-stats") && path.includes("id_292"))
    ).toBe(true);
  });
});
