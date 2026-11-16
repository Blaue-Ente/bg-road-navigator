import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDatexSituations } from "@/lib/hazards/datex-parse";
import { hazardWarnings } from "@/lib/hazards/present";

const xml = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "fixtures/datex-situations.xml"),
  "utf8"
);

describe("hazard present", () => {
  const hazards = parseDatexSituations(xml, {
    now: new Date("2026-11-15T12:00:00.000Z"),
  });
  const danger = hazards.find((hazard) => hazard.id === "ac-mislabelled-1")!;

  it("trims en warning lines", () => {
    const line = hazardWarnings([danger], "en")[0]!;
    expect(line).toMatch(/^Hazard: I-1 km 12\+300/);
    expect(line).toMatch(/12\+300\. Valid until /);
    expect(line).not.toMatch(/\s$/);
    expect(line).not.toContain("(s)");
  });

  it("separates road km and validity for tr and ro", () => {
    const en = hazardWarnings([danger], "en")[0]!;
    const tr = hazardWarnings([danger], "tr")[0]!;
    const ro = hazardWarnings([danger], "ro")[0]!;
    expect(en).toMatch(/12\+300\. Valid until /);
    expect(tr).toMatch(/12\+300\. /);
    expect(tr).toMatch(/tarihine kadar geçerli\.$/);
    expect(ro).toMatch(/12\+300\. Valabil până la /);
  });
});