import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const CYRILLIC = /[\u0400-\u04FF]/;
const ROOT = path.resolve(__dirname, "../..");

/**
 * Files that may still hold Cyrillic until a follow-up migration slice.
 * TripProximity.test.tsx: fixture copy, not production UI.
 * CountryFlag.tsx: ISO-derived labels.
 */
const ALLOWLIST = new Set([
  "components/location/TripProximity.test.tsx",
]);

function collectTsx(dir: string, acc: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules") continue;
      collectTsx(full, acc);
    } else if (ent.name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

function isCommentLine(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

/** UI copy in literals/JSX text — not data fields or interpolated templates. */
function isHardCodedUiLine(line: string): boolean {
  if (!CYRILLIC.test(line) || isCommentLine(line)) return false;
  if (/\b\w+_bg\b/.test(line)) return false;
  if (/\.(instruction_bg|condition_bg|label_bg)\b/.test(line)) return false;
  if (/["'`][^"'`]*[А-Яа-я][^"'`]*["'`]/.test(line)) return true;
  if (/>\s*[^<{}]*[А-Яа-я][^<{}]*\s*</.test(line)) return true;
  if (/^\s*[^<>{}/]*[А-Яа-я][^<>{}/]*\s*$/.test(line)) return true;
  return false;
}

describe("no Cyrillic UI literals outside i18n", () => {
  it("app/ and components/ tsx have no hard-coded Cyrillic", () => {
    const dirs = [path.join(ROOT, "app"), path.join(ROOT, "components")];
    const offenders: string[] = [];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      for (const file of collectTsx(dir)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, "/");
        if (ALLOWLIST.has(rel)) continue;
        const lines = fs.readFileSync(file, "utf8").split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!isHardCodedUiLine(line)) continue;
          offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
        }
      }
    }
    expect(
      offenders,
      `Move these strings into lib/i18n (allowlist: ${[...ALLOWLIST].join(", ")})`
    ).toEqual([]);
  });
});