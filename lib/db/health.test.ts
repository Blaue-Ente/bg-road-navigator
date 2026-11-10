import { describe, expect, it } from "vitest";
import { authTablesReady, probeDatabase } from "@/lib/db/health";

describe("authTablesReady", () => {
  it("requires every Better Auth table", () => {
    expect(
      authTablesReady(["user", "session", "account", "verification"])
    ).toBe(true);
    expect(authTablesReady(["user", "session", "account"])).toBe(false);
  });
});

describe("probeDatabase", () => {
  it("reports an unreachable database without hanging", async () => {
    const started = Date.now();
    const result = await probeDatabase(
      "postgres://nobody:nobody@127.0.0.1:1/none",
      400
    );
    expect(result).toEqual({ reachable: false, authTablesReady: false });
    expect(Date.now() - started).toBeLessThan(3000);
  });
});
