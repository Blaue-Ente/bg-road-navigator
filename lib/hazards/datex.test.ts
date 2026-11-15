import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearOsmMemoryCacheForTests } from "@/lib/nakordoni/cache-store";
import {
  DATEX_FILES_BASE,
  DATEX_INDEX_URL,
  discoverDatexFiles,
  fallbackDatexUrls,
  loadRoadHazards,
  resetDatexForTests,
  setDatexTransportForTests,
} from "@/lib/hazards/datex";

const xml = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "fixtures/datex-situations.xml"
  ),
  "utf8"
);

const INDEX = `
  <a href="/files/20261114_roadworks_r03.xml">вчера</a>
  <a href="https://datasheet.api.bg/files/20261115_roadworks_r03.xml">днес</a>
  <a href="/files/20261115_closed_roads_r01.xml">затворени</a>
  <a href="/files/20261115_other_x99.xml">друго</a>
`;

afterEach(() => {
  resetDatexForTests();
  clearOsmMemoryCacheForTests();
  vi.unstubAllEnvs();
});

describe("DATEX file discovery", () => {
  it("picks the newest file for each known code and skips the rest", () => {
    expect(discoverDatexFiles(INDEX)).toEqual([
      `${DATEX_FILES_BASE}/20261115_roadworks_r03.xml`,
      `${DATEX_FILES_BASE}/20261115_closed_roads_r01.xml`,
    ]);
  });

  it("builds today's filenames when the index has no links", () => {
    const urls = fallbackDatexUrls(new Date("2026-11-15T10:00:00.000Z"));
    expect(urls[0]).toBe(`${DATEX_FILES_BASE}/20261115_roadworks_r03.xml`);
    expect(urls.map((url) => url.slice(url.lastIndexOf("_") + 1))).toEqual([
      "r03.xml",
      "r01.xml",
      "r02.xml",
      "d02.xml",
      "d01.xml",
      "o05.xml",
      "w05.xml",
    ]);
  });
});

describe("DATEX loader", () => {
  it("reads the index once per 15 minutes and parses the files", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const calls: string[] = [];
    setDatexTransportForTests(async (url) => {
      calls.push(url);
      if (url === DATEX_INDEX_URL) return { status: 200, body: INDEX };
      return { status: 200, body: xml };
    });
    const now = Date.parse("2026-11-15T12:00:00.000Z");
    const first = await loadRoadHazards(now);
    const second = await loadRoadHazards(now + 60_000);
    expect(first.map((hazard) => hazard.id)).toContain("rw-trakia-1");
    expect(second).toEqual(first);
    expect(calls.filter((url) => url === DATEX_INDEX_URL)).toHaveLength(1);
    expect(calls).toHaveLength(3);
  });

  it("tries yesterday after a 404 and stays quiet when the host does not answer", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const calls: string[] = [];
    setDatexTransportForTests(async (url) => {
      calls.push(url);
      if (url === DATEX_INDEX_URL)
        return { status: 200, body: "<html></html>" };
      if (url.endsWith("/20261115_roadworks_r03.xml")) {
        return { status: 404, body: "missing" };
      }
      if (url.endsWith("/20261114_roadworks_r03.xml")) {
        return { status: 200, body: xml };
      }
      return null;
    });
    const now = Date.parse("2026-11-15T12:00:00.000Z");
    const rows = await loadRoadHazards(now);
    expect(rows.map((hazard) => hazard.id)).toContain("closed-hemus-1");
    expect(
      calls.some((url) => url.endsWith("/20261114_roadworks_r03.xml"))
    ).toBe(true);
    expect(calls.filter((url) => url.includes("20261114_")).length).toBe(1);

    calls.length = 0;
    resetDatexForTests();
    clearOsmMemoryCacheForTests();
    setDatexTransportForTests(async (url) => {
      calls.push(url);
      return null;
    });
    expect(await loadRoadHazards(now)).toEqual([]);
    expect(await loadRoadHazards(now + 1_000)).toEqual([]);
    expect(calls).toHaveLength(1 + 7);
  });
});
