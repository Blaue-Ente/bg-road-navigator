import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function collect(dir: string, acc: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) collect(full, acc);
    else if (/\.tsx?$/.test(ent.name) && !/\.test\./.test(ent.name)) acc.push(full);
  }
  return acc;
}

/** A store selector that builds a new array or object makes React loop (error #185). */
describe("zustand selectors stay stable", () => {
  it("none maps or filters inside the selector", () => {
    const bad: string[] = [];
    for (const dir of ["components", "app", "lib/hooks"]) {
      for (const file of collect(path.join(ROOT, dir))) {
        const lines = fs.readFileSync(file, "utf8").split("\n");
        lines.forEach((line, index) => {
          if (/use\w+Store\(\s*\(?\w*\)?\s*=>[^)]*\.(map|filter|slice)\(/.test(line)) {
            bad.push(`${path.relative(ROOT, file)}:${index + 1}`);
          }
        });
      }
    }
    expect(bad).toEqual([]);
  });
});
