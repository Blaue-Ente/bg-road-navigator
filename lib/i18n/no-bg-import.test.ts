import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const ALLOWLIST = new Set(["app/layout.tsx"]);

function walkTs(dir: string, acc: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules") continue;
      walkTs(full, acc);
    } else if (
      (ent.name.endsWith(".ts") || ent.name.endsWith(".tsx")) &&
      !ent.name.includes(".test.")
    ) {
      acc.push(full);
    }
  }
  return acc;
}

const BANNED =
  /from\s+["']@\/lib\/i18n["'][^;]*\bmessages\b|from\s+["']@\/lib\/i18n\/locales\/bg["'](?![\s\S]*import\s+type)/;

describe("client UI does not import Bulgarian messages", () => {
  it("app/ and components/ avoid messages from @/lib/i18n", () => {
    const offenders: string[] = [];
    for (const base of ["app", "components"]) {
      const dir = path.join(ROOT, base);
      if (!fs.existsSync(dir)) continue;
      for (const file of walkTs(dir)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, "/");
        if (ALLOWLIST.has(rel)) continue;
        const text = fs.readFileSync(file, "utf8");
        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            line.includes('from "@/lib/i18n"') &&
            (line.includes("messages") || /\bbg\b/.test(line))
          ) {
            offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
          }
          if (
            line.includes('from "@/lib/i18n/locales/bg"') &&
            !line.includes("import type")
          ) {
            offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
    expect(offenders, "Use useMessages() in client code; layout.tsx is allowlisted").toEqual(
      []
    );
  });
});