import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  classifyHazard,
  parseDatexSituations,
} from "@/lib/hazards/datex-parse";
import { datexAttributionBg, hazardWarnings } from "@/lib/hazards/present";

const xml = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "fixtures/datex-situations.xml"
  ),
  "utf8"
);

const NOW = new Date("2026-11-15T12:00:00.000Z");

describe("DATEX situation parser", () => {
  const hazards = parseDatexSituations(xml, { now: NOW });

  it("classifies by the record and the Bulgarian text, not xsi:type Roadworks", () => {
    expect(xml.match(/xsi:type="Roadworks"/g)?.length).toBeGreaterThan(3);
    expect(hazards.map((hazard) => [hazard.id, hazard.kind])).toEqual([
      ["rw-trakia-1", "roadworks"],
      ["ac-mislabelled-1", "danger"],
      ["ac-text-only-1", "danger"],
      ["closed-hemus-1", "closed"],
      ["poor-road-1", "conditions"],
      ["fog-1", "conditions"],
    ]);
  });

  it("keeps the official text, the road and kilometre, and the end time", () => {
    const repair = hazards.find((hazard) => hazard.id === "rw-trakia-1");
    expect(repair).toMatchObject({
      label_bg: "Ремонт",
      road_km_bg: "АМ Тракия, км 45",
      lng: 23.3219,
      lat: 42.6977,
      valid_until: "2026-11-20T18:00:00+02:00",
    });
    expect(repair?.text_bg).toContain("Ремонт на АМ Тракия");
    expect(repair?.text_bg).not.toContain("Roadworks on the Trakia");
    expect(
      hazards.find((hazard) => hazard.id === "ac-mislabelled-1")?.road_km_bg
    ).toBe("път I-1, км 12+300");
    expect(
      hazards.find((hazard) => hazard.id === "poor-road-1")?.road_km_bg
    ).toBe("път II-86, км 10");
    expect(
      hazards.find((hazard) => hazard.id === "closed-hemus-1")
    ).toMatchObject({
      label_bg: "Затворен път",
      road_km_bg: "АМ Хемус, км 23",
    });
    expect(hazards.find((hazard) => hazard.id === "fog-1")?.label_bg).toBe(
      "Лоши условия"
    );
  });

  it("drops an expired record and a record without a point", () => {
    expect(hazards.map((hazard) => hazard.id)).not.toContain("expired-1");
    expect(hazards.map((hazard) => hazard.id)).not.toContain("no-point-1");
  });

  it("credits АПИ on the checklist warning", () => {
    const lines = hazardWarnings(
      hazards.filter((hazard) => hazard.kind === "closed")
    );
    expect(lines[0]).toContain("Затворен път");
    expect(lines[0]).toContain("АМ Хемус, км 23");
    expect(lines[0]).toContain("Валидно до");
    expect(lines.at(-1)).toBe(datexAttributionBg());
  });

  it("returns nothing for a broken document", () => {
    expect(parseDatexSituations("<situation", { now: NOW })).toEqual([]);
  });

  it("treats a closed lane during repair as ремонт and a closed road as затворен път", () => {
    expect(
      classifyHazard(
        { roadworks: { roadworksType: "resurfacingWork" } },
        "Ремонт. Затворена лява лента на АМ Тракия при км 8."
      )
    ).toBe("roadworks");
    expect(
      classifyHazard(
        { roadworks: {} },
        "Пътят е затворен на АМ Хемус при км 23."
      )
    ).toBe("closed");
  });
});
