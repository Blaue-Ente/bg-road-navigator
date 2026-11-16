import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

function assertTapTarget(
  source: string,
  dataTap: string,
  label: string
): void {
  expect(source, `${label}: missing data-tap="${dataTap}"`).toContain(
    `data-tap="${dataTap}"`
  );
  const blocks = source.split(`data-tap="${dataTap}"`);
  blocks.shift();
  expect(blocks.length, label).toBeGreaterThan(0);
  for (const block of blocks) {
    const classChunk = block.slice(0, 400);
  expect(classChunk, `${label} (${dataTap})`).toContain("min-h-11");
  }
}

const TAP_CHECKS: Array<{ file: string; tap: string; label: string }> = [
  { file: "components/map/MapLegend.tsx", tap: "legend-summary", label: "Legend" },
  { file: "components/layout/TopBar.tsx", tap: "sign-in", label: "Sign in" },
  {
    file: "app/(app)/tips/page.tsx",
    tap: "tips-category-chip",
    label: "Tips chips",
  },
  {
    file: "components/map/RouteBottomSheet.tsx",
    tap: "stop-quick-fuel",
    label: "Fuel quick action",
  },
  {
    file: "components/map/RouteBottomSheet.tsx",
    tap: "stop-quick-rest",
    label: "Rest quick action",
  },
  {
    file: "app/(app)/borders/page.tsx",
    tap: "borders-tab",
    label: "Border tabs",
  },
  {
    file: "components/borders/BorderWebcam.tsx",
    tap: "border-live",
    label: "Border live link",
  },
];

function assertBorderOfficialLinkTaps(source: string): void {
  expect(source).toContain("border-link-bulletin");
  expect(source).toContain("border-link-cameras");
  expect(source).toContain("min-h-11");
}

describe("tap targets (PR 23)", () => {
  it("hides the home overlay locale switcher below sm", () => {
    const home = readSource("app/(app)/page.tsx");
    expect(home).toContain("hidden shrink-0 sm:block");
    expect(home).toMatch(/<LocaleSwitcher/);
  });

  it("defines overlay slots on the map column", () => {
    const experience = readSource("components/map/MapExperience.tsx");
    expect(readSource("components/map/MapOverlayColumn.tsx")).toContain(
      'data-overlay-slot="column"'
    );
    expect(experience).toContain('data-overlay-slot="legend-row"');
    expect(readSource("components/map/HomeMapChips.tsx")).toContain(
      'data-overlay-slot="chips"'
    );
    expect(readSource("components/map/RouteBottomSheet.tsx")).toContain(
      'data-overlay-slot="bottom-sheet"'
    );
    expect(readSource("components/map/MapLegend.tsx")).toContain(
      'data-overlay-slot="legend"'
    );
  });

  it("does not position legend, info, or chips with absolute bottom-*", () => {
    for (const file of [
      "components/map/MapLegend.tsx",
      "components/map/HotspotAttributionButton.tsx",
      "components/map/HomeMapChips.tsx",
    ]) {
      const source = readSource(file);
      expect(source, file).not.toMatch(/\bbottom-\[calc/);
      expect(source, file).not.toMatch(/\bmd:bottom-/);
    }
  });

  for (const check of TAP_CHECKS) {
    it(`gives ${check.label} min-h-11`, () => {
      assertTapTarget(readSource(check.file), check.tap, check.label);
    });
  }

  it("gives official border links min-h-11", () => {
    assertBorderOfficialLinkTaps(readSource("components/borders/BorderCard.tsx"));
  });

  it("gives map basemap attribution control min-h-11", () => {
    const source = readSource("components/map/MapAttributionButton.tsx");
    expect(source).toContain("openfreemap.org");
    expect(source).toContain("openmaptiles.org");
    expect(source).toContain("openstreetmap.org/copyright");
    expect(source).toContain("min-h-11");
  });
});