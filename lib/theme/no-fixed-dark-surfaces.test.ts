import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(import.meta.dirname, "../..");

const FORBIDDEN_PATTERNS = [
  /bg-gray-9/,
  /bg-gray-8/,
  /bg-slate-9/,
  /text-gray-/,
] as const;

const WEBCAM_FOOTER_ALLOWLIST = "components/borders/BorderWebcam.tsx";

function collectTsxFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectTsxFiles(full, acc);
    } else if (name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

function lineHasForbiddenPattern(line: string): boolean {
  if (/bg-black\/(40|50)/.test(line)) {
    return false;
  }
  return FORBIDDEN_PATTERNS.some((re) => re.test(line));
}

function stripWebcamFooter(source: string): string {
  const marker = "function WebcamFooter";
  const start = source.indexOf(marker);
  if (start < 0) return source;
  return source.slice(0, start);
}

describe("no fixed dark Tailwind surfaces in app UI", () => {
  it("has no bg-gray-8/9, bg-slate-9, or text-gray-* outside the webcam overlay footer", () => {
    const roots = [
      join(REPO_ROOT, "components"),
      join(REPO_ROOT, "app"),
    ];
    const files = roots.flatMap((root) => collectTsxFiles(root));
    const violations: string[] = [];

    for (const file of files) {
      const rel = relative(REPO_ROOT, file).replace(/\\/g, "/");
      let source = readFileSync(file, "utf8");
      if (rel === WEBCAM_FOOTER_ALLOWLIST) {
        source = stripWebcamFooter(source);
      }

      const lines = source.split("\n");
      lines.forEach((line, index) => {
        if (lineHasForbiddenPattern(line)) {
          violations.push(`${rel}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});