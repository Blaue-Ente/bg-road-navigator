import { describe, expect, it } from "vitest";
import { fetchAccountUsage, stripSecrets } from "@/lib/nakordoni/account-usage";

describe("account usage", () => {
  it("removes credential-like fields at any depth", () => {
    const out = stripSecrets({
      plan: "explorer",
      api_key: "NKD-DEV-1",
      nested: { token: "x", remaining: 12, list: [{ secret: "s", ok: 1 }] },
    });
    expect(out).toEqual({ plan: "explorer", nested: { remaining: 12, list: [{ ok: 1 }] } });
  });

  it("makes no call without a key", async () => {
    let called = false;
    const result = await fetchAccountUsage(undefined, (async () => {
      called = true;
      return new Response("{}");
    }) as typeof fetch);
    expect(called).toBe(false);
    expect(result).toMatchObject({ configured: false, ok: false });
  });

  it("reports the status and the cleaned body", async () => {
    const fetcher = (async (_url: string, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer k");
      return new Response(JSON.stringify({ countries: ["BG", "RO"], api_key: "k" }), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await fetchAccountUsage("k", fetcher);
    expect(result).toMatchObject({ ok: true, status: 200, usage: { countries: ["BG", "RO"] } });
    expect(JSON.stringify(result)).not.toContain('"k"');
  });

  it("reports a refusal without throwing", async () => {
    const fetcher = (async () => new Response("{}", { status: 403 })) as unknown as typeof fetch;
    expect(await fetchAccountUsage("k", fetcher)).toMatchObject({ ok: false, status: 403 });
  });
});
