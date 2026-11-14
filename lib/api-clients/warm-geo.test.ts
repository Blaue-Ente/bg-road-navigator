import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/warm-geo/route";
import { clearPhotonCacheForTests } from "@/lib/api-clients/photon";
import { warmOciGeo } from "@/lib/api-clients/warm-geo";

const KEY = "super-secret-key-value";

afterEach(() => {
  clearPhotonCacheForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("warm geo cron", () => {
  it("skips the upstream when OCI is not configured", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "");
    vi.stubEnv("OCI_GEO_API_KEY", "");
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return new Response("no", { status: 500 });
    });
    const result = await warmOciGeo();
    expect(result).toEqual({ ok: true, warmed: false, reason: "unconfigured" });
    expect(seen).toHaveLength(0);
  });

  it("pings Valhalla status and a tiny Photon query without returning the key", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
    vi.stubEnv("OCI_GEO_API_KEY", KEY);
    vi.stubEnv("CRON_SECRET", "cron-secret-value");
    const seen: string[] = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        seen.push(url);
        expect(new Headers(init?.headers).get("X-API-Key")).toBe(KEY);
        expect(url).not.toContain(KEY);
        return Response.json({ status: "ok" });
      }
    );

    const response = await GET(
      new Request("https://example.test/api/cron/warm-geo", {
        headers: { authorization: "Bearer cron-secret-value" },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      warmed: true,
      valhalla: "ok",
      photon: "ok",
    });
    expect(JSON.stringify(body)).not.toContain(KEY);
    expect(seen.some((url) => url.endsWith("/valhalla/status"))).toBe(true);
    expect(
      seen.some((url) => url.includes("/photon/api?q=Sofia&limit=1"))
    ).toBe(true);
  });

  it("returns 401 when the cron secret does not match", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-value");
    const response = await GET(
      new Request("https://example.test/api/cron/warm-geo")
    );
    expect(response.status).toBe(401);
  });
});
