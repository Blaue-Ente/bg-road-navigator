import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../..");
const appPagesDir = join(root, "app/(app)");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

function listAppPages(): string[] {
  return readdirSync(appPagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(appPagesDir, entry.name, "page.tsx"))
    .filter((path) => {
      try {
        readFileSync(path, "utf8");
        return true;
      } catch {
        return false;
      }
    });
}

describe("headings (PR 24)", () => {
  it("does not use h1 in TopBar", () => {
    const topBar = readSource("components/layout/TopBar.tsx");
    expect(topBar).not.toMatch(/<h1[\s>]/);
  });

  it("each app page exposes exactly one primary heading", () => {
    const pages = listAppPages();
    expect(pages.length).toBeGreaterThan(0);

    for (const absolutePath of pages) {
      const relative = absolutePath.slice(root.length + 1);
      const source = readFileSync(absolutePath, "utf8");
      const h1Count = (source.match(/<h1[\s>]/g) ?? []).length;
      const pageHeaderCount = (source.match(/<PageHeader/g) ?? []).length;
      const headingSlots = h1Count + pageHeaderCount;
      expect(
        headingSlots,
        `${relative}: expected one <h1> or <PageHeader>, found ${headingSlots} (h1=${h1Count}, PageHeader=${pageHeaderCount})`
      ).toBe(1);
    }
  });

  it("home page includes an sr-only h1 title", () => {
    const home = readSource("app/(app)/page.tsx");
    expect(home).toMatch(/<h1[^>]*className="sr-only"/);
    expect(home).toContain("m.home.title");
  });

  it("MapLegend groups incidents and supports triangle markers", () => {
    const legend = readSource("components/map/MapLegend.tsx");
    expect(legend).toContain("groupIncidents");
    expect(legend).toContain("triangle");
    expect(legend).toContain("groupSections");
    expect(legend).toContain("groupHazards");
  });

  it("planner inputs do not use outline-none", () => {
    const routeDir = join(root, "components/route");
    for (const file of readdirSync(routeDir)) {
      if (!file.endsWith(".tsx")) continue;
      const source = readFileSync(join(routeDir, file), "utf8");
      expect(source, `components/route/${file}`).not.toContain("outline-none");
    }
  });
});