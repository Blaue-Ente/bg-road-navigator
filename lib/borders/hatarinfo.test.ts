import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearOsmMemoryCacheForTests } from "@/lib/nakordoni/cache-store";
import {
  HATARINFO_TTL_MS,
  HATARINFO_USER_AGENT,
  hungarySerbiaDirection,
  loadHatarinfo,
  resetHatarinfoForTests,
} from "@/lib/borders/hatarinfo";

const html = readFileSync(
  new URL("./fixtures/hatarinfo-rs.html", import.meta.url),
  "utf8"
);
const now = Date.parse("2030-01-01T00:00:00.000Z");

afterEach(() => {
  resetHatarinfoForTests();
  clearOsmMemoryCacheForTests();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("loadHatarinfo", () => {
  it("fetches once per 15 minutes and sends the BGRN user agent", async () => {
    vi.stubEnv("DATABASE_URL", "");
    let calls = 0;
    vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
      calls += 1;
      expect(new Headers(init?.headers).get("user-agent")).toBe(
        HATARINFO_USER_AGENT
      );
      return new Response(html, { status: 200 });
    });

    const first = await loadHatarinfo(now);
    const second = await loadHatarinfo(now + 60_000);
    expect(calls).toBe(1);
    expect(first?.crossings.find((row) => row.id === "horgos")?.in?.minutes).toBe(
      30
    );
    expect(second?.fetchedAt).toBe(first?.fetchedAt);

    await loadHatarinfo(now + HATARINFO_TTL_MS + 1);
    expect(calls).toBe(2);
  });

  it("keeps the last good snapshot when the next fetch fails", async () => {
    vi.stubEnv("DATABASE_URL", "");
    let calls = 0;
    vi.stubGlobal("fetch", async () => {
      calls += 1;
      if (calls === 1) return new Response(html, { status: 200 });
      return new Response("no", { status: 503 });
    });

    const good = await loadHatarinfo(now);
    const kept = await loadHatarinfo(now + HATARINFO_TTL_MS + 1);
    const still = await loadHatarinfo(now + HATARINFO_TTL_MS + 60_000);
    expect(kept?.fetchedAt).toBe(good?.fetchedAt);
    expect(still?.fetchedAt).toBe(good?.fetchedAt);
    expect(calls).toBe(2);
  });
});

describe("hungarySerbiaDirection", () => {
  it("treats a northbound trip as entering Hungary", () => {
    expect(hungarySerbiaDirection({ lat: 44.8 }, { lat: 47.5 })).toBe("in");
    expect(hungarySerbiaDirection({ lat: 47.5 }, { lat: 44.8 })).toBe("out");
  });
});
