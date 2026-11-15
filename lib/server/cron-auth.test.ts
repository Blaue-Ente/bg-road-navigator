import { describe, expect, it } from "vitest";
import { authorizeCron } from "@/lib/server/cron-auth";

const SECRET = "cron-secret-value";

function request(headers: Record<string, string> = {}) {
  return new Request("https://example.test/api/cron/warm-geo", { headers });
}

describe("authorizeCron", () => {
  it("allows the route when CRON_SECRET is unset", () => {
    expect(authorizeCron(request(), {})).toBe(true);
  });

  it("accepts the Vercel bearer header and x-cron-secret", () => {
    const env = { CRON_SECRET: SECRET };
    expect(
      authorizeCron(request({ authorization: `Bearer ${SECRET}` }), env)
    ).toBe(true);
    expect(authorizeCron(request({ "x-cron-secret": SECRET }), env)).toBe(true);
  });

  it("rejects a missing or wrong secret", () => {
    const env = { CRON_SECRET: SECRET };
    expect(authorizeCron(request(), env)).toBe(false);
    expect(
      authorizeCron(request({ authorization: "Bearer other-secret" }), env)
    ).toBe(false);
  });
});
