import { describe, expect, it } from "vitest";
import { buildChecklist } from "@/lib/planner/checklist";
import type { VignetteLink } from "@/lib/constants/vignettes";

const bg: VignetteLink = {
  country_code: "BG",
  kind: "vignette",
  name_bg: "България — електронна винетка",
  name_en: "Bulgaria",
  official_url: "https://www.bgtoll.bg/",
  notes_bg: "BGTOLL",
};

const tr: VignetteLink = {
  country_code: "TR",
  kind: "distance_toll",
  name_bg: "Турция — HGS",
  name_en: "Turkey",
  official_url: "https://hgsmusteri.ptt.gov.tr/",
  notes_bg: "HGS",
};

describe("plan checklist", () => {
  it("lists the official vignette, the toll, and the Turkey documents", () => {
    const checklist = buildChecklist({
      countries: ["BG", "TR"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: true,
      withChildren: true,
      childrenAges: [4],
      tolls: [bg, tr],
    });
    expect(checklist.vignettes.map((item) => item.href)).toEqual([
      "https://www.bgtoll.bg/",
    ]);
    expect(checklist.toll_sections.map((item) => item.country_code)).toEqual([
      "TR",
    ]);
    expect(checklist.documents.map((item) => item.id)).toEqual(
      expect.arrayContaining(["tr-documents", "pet-passport", "child-seat"])
    );
    expect(checklist.kit.map((item) => item.id)).toEqual(
      expect.arrayContaining(["vest", "triangle"])
    );
    expect(
      checklist.winter.find((item) => item.country_code === "BG")?.detail
    ).toContain("Зимни гуми");
  });

  it("leaves the pet passport and the child seat off a solo trip", () => {
    const checklist = buildChecklist({
      countries: ["BG"],
      departAt: new Date("2026-07-01T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [bg],
    });
    expect(checklist.documents.map((item) => item.id)).not.toContain(
      "pet-passport"
    );
    expect(checklist.documents.map((item) => item.id)).not.toContain(
      "child-seat"
    );
    expect(
      checklist.winter.find((item) => item.country_code === "BG")?.detail
    ).toContain("Извън обичайния сезон");
  });
});
