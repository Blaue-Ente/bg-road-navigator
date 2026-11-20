import { describe, expect, it } from "vitest";
import { refreshNakordoniCache } from "@/lib/nakordoni/refresh";
import { isNegativeCachePayload } from "@/lib/planner/nakordoni-budget";

describe("Nakordoni refresh backoff", () => {
  it("does not plan GR/MK jobs, counts statuses, and skips a fresh 403", async () => {
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
        if (
          ["id_484", "id_485", "id_400", "id_403"].some((id) => path.includes(id))
        ) {
          throw new Error(`unlicensed checkpoint requested: ${path}`);
        }
        if (path.includes("/border/12/15/") || path.includes("/border/12/19/")) {
          throw new Error(`unlicensed pair requested: ${path}`);
        }
        if (path.includes("day-stats") && path.includes("id_390")) {
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
    expect(isNegativeCachePayload(store.get("day-stats:id_390")?.payload)).toBe(
      true
    );
    expect(store.has("day-stats:id_292")).toBe(false);

    seen.length = 0;
    await refreshNakordoniCache(new Date("2026-11-15T06:10:00.000Z"), deps);
    expect(
      seen.some((path) => path.includes("day-stats") && path.includes("id_390"))
    ).toBe(false);
    expect(
      seen.some((path) => path.includes("day-stats") && path.includes("id_292"))
    ).toBe(true);
  });
});
