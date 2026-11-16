import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const CYRILLIC = /[\u0400-\u04FF]/;
const ROOT = path.resolve(__dirname, "../..");
const LIB = path.join(ROOT, "lib");

/**
 * Paths under lib/ that may keep Cyrillic on purpose (one-line reason each).
 */
const ALLOWLIST: Record<string, string> = {
  "lib/i18n/locales": "Canonical BG/EN/TR/RO message catalogs (source of truth).",
  "lib/constants/european-cities.ts":
    "City search/display names including Cyrillic exonyms for Bulgarian queries.",
  "lib/geo/street-match.ts":
    "Bulgarian street-token matching for geocoding.",
  "lib/api-clients/photon.ts":
    "Search alias tables with Cyrillic spellings so BG queries match Photon.",
  "lib/geo/country-names-bg.ts": "Bulgarian country name table (`bg` locale).",
  "lib/hazards/datex-parse.ts":
    "Parses Bulgarian upstream DATEX/RSS text from Road Agency feeds.",
  "lib/hotspots/cherna.ts": "Parses Bulgarian Cherna pista upstream strings.",
  "lib/hotspots/mvr.ts": "Parses Bulgarian MVR bulletin upstream strings.",
  "lib/hazards/cherna-pista.ts":
    "Parses Bulgarian Cherna pista hazard feed text.",
  "lib/api-clients/nvidia.ts": "LLM trip-planner prompt template (Bulgarian source).",
};

const BG_SOURCE_FIELD = /\b(bg|\w+_bg|\w+Bg)\s*:/;

function isCommentLine(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

function relAllowlisted(rel: string): boolean {
  const normalized = rel.replace(/\\/g, "/");
  for (const prefix of Object.keys(ALLOWLIST)) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      collectTsFiles(full, acc);
    } else if (ent.name.endsWith(".ts") && !ent.name.endsWith(".test.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("no Cyrillic in lib/ except allowlisted BG sources", () => {
  it("documents the allowlist explicitly", () => {
    expect(Object.keys(ALLOWLIST).length).toBeGreaterThanOrEqual(10);
  });

  it("lib/**/*.ts has no surprise Cyrillic literals", () => {
    const offenders: string[] = [];
    for (const file of collectTsFiles(LIB)) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      if (relAllowlisted(rel)) continue;
      const lines = fs.readFileSync(file, "utf8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!CYRILLIC.test(line)) continue;
        if (isCommentLine(line)) continue;
        if (BG_SOURCE_FIELD.test(line)) continue;
        offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    }
    expect(
      offenders,
      `Move strings into i18n catalogs or allowlist with reason (see test file). Hits: ${offenders.slice(0, 20).join(" | ")}`
    ).toEqual([]);
  });
});