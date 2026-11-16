import { describe, expect, it } from "vitest";
import { buildChecklist } from "@/lib/planner/checklist";
import { TRAVEL_ADVICE_BY_LOCALE } from "@/lib/constants/border-official-links";
import { ROAD_SAFETY_ITEM_IDS, roadSafetyCopy } from "@/lib/i18n/road-safety";
import {
  getVignetteByCountryCode,
  type VignetteLink,
} from "@/lib/constants/vignettes";

const bg: VignetteLink = {
  country_code: "BG",
  kind: "vignette",
  name: {
    bg: "България — електронна винетка",
    en: "Bulgaria",
    tr: "Bulgaristan",
    ro: "Bulgaria",
  },
  name_bg: "България — електронна винетка",
  name_en: "Bulgaria",
  official_url: "https://web.bgtoll.bg/",
  link_role: "shop",
  notes: { bg: "BGTOLL", en: "BGTOLL", tr: "BGTOLL", ro: "BGTOLL" },
  notes_bg: "BGTOLL",
};

const tr: VignetteLink = {
  country_code: "TR",
  kind: "distance_toll",
  name: {
    bg: "Турция — HGS",
    en: "Turkey",
    tr: "Türkiye HGS",
    ro: "Turcia HGS",
  },
  name_bg: "Турция — HGS",
  name_en: "Turkey",
  official_url: "https://hgsmusteri.ptt.gov.tr/",
  link_role: "shop",
  notes: { bg: "HGS", en: "HGS", tr: "HGS", ro: "HGS" },
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
      "https://web.bgtoll.bg/",
    ]);
    expect(checklist.vignettes[0]?.link_role).toBe("shop");
    expect(checklist.vignettes[0]?.link_label).toBe("Официален магазин");
    expect(checklist.toll_sections.map((item) => item.country_code)).toEqual([
      "TR",
    ]);
    expect(checklist.documents.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "tr-documents",
        "pet-passport",
        "child-seat",
        "mfa-advice",
        "citizenship-docs",
      ])
    );
    expect(
      checklist.documents.find((item) => item.id === "pet-passport")?.href
    ).toContain("movement-pets");
    expect(
      checklist.documents.find((item) => item.id === "mfa-advice")
    ).toMatchObject({
      href: "https://www.mfa.bg/bg/uslugi-patuvania/konsulski-uslugi/patuvane-chujbina",
      link_label: "Съвети за пътуване",
    });
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
    expect(checklist.documents.map((item) => item.id)).not.toContain(
      "mfa-advice"
    );
    expect(
      checklist.winter.find((item) => item.country_code === "BG")?.detail
    ).toContain("Извън обичайния сезон");
  });

  it("shows the Bulgaria safety block only when the route enters Bulgaria", () => {
    const through = buildChecklist({
      countries: ["DE", "BG"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [],
    });
    expect(
      through.safety.filter((item) => item.kind === "law").length
    ).toBeGreaterThan(0);
    expect(
      through.safety
        .filter((item) => item.kind === "advice")
        .map((item) => item.detail)
    ).toEqual(["Почивайте около всеки 2 часа."]);
    expect(through.safety_closing).toBe("Пазете себе си и другите на пътя.");
    expect(through.safety.map((item) => item.detail).join(" ")).toContain(
      "0,5‰"
    );
    expect(through.safety.map((item) => item.detail).join(" ")).toContain(
      "150 см"
    );
    expect(through.bg_links.map((item) => item.href)).toEqual([
      "https://www.sars.gov.bg/uchastatsi-s-kontsentratsia-na-patnotransportni-proizshestvia-ukptp/",
      "https://traffic.api.bg/",
    ]);

    const abroad = buildChecklist({
      countries: ["DE", "AT"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [],
    });
    expect(abroad.safety).toEqual([]);
    expect(abroad.safety_closing).toBeNull();
    expect(abroad.bg_links).toEqual([]);
  });

  it("adds the citizenship note for Germany to Turkey without EU-citizen wording", () => {
    const checklist = buildChecklist({
      countries: ["DE", "TR"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [tr],
    });
    const citizenship = checklist.documents.find(
      (item) => item.id === "citizenship-docs"
    );
    expect(citizenship?.detail).toMatch(/гражданството/);
    expect(citizenship?.detail).not.toMatch(/ЕС граждани/);
    const blob = checklist.documents.map((item) => item.detail).join(" ");
    expect(blob).not.toMatch(/ЕС граждани/);
  });

  it("returns Romanian safety block title and stable law item ids", () => {
    const checklist = buildChecklist({
      locale: "ro",
      countries: ["DE", "BG"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [],
    });
    expect(roadSafetyCopy("ro").title).toBe("Siguranța în Bulgaria");
    expect(checklist.safety_closing).toBe("Aveți grijă de dvs. și de ceilalți pe drum.");
    const lawIds = checklist.safety
      .filter((item) => item.kind === "law")
      .map((item) => item.id);
    expect(lawIds).toEqual([...ROAD_SAFETY_ITEM_IDS.law]);
    expect(
      checklist.safety.find((item) => item.kind === "law")?.title
    ).toBeTruthy();
  });

  it("links locale-specific consular travel advice", () => {
    const en = buildChecklist({
      locale: "en",
      countries: ["DE", "AT"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [],
    });
    expect(
      en.documents.find((item) => item.id === "mfa-advice")
    ).toMatchObject({
      href: TRAVEL_ADVICE_BY_LOCALE.en.href,
      title: "Your Europe — travel documents",
    });
    const ro = buildChecklist({
      locale: "ro",
      countries: ["DE", "RO"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [],
    });
    expect(
      ro.documents.find((item) => item.id === "mfa-advice")
    ).toMatchObject({
      href: TRAVEL_ADVICE_BY_LOCALE.ro.href,
      title: "Sfaturi de călătorie MAE România",
    });
  });

  it("lists the Hungarian e-vignette on an Austria–Hungary–Romania corridor", () => {
    const checklist = buildChecklist({
      countries: ["DE", "AT", "HU", "RO"],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls: [getVignetteByCountryCode("HU")!],
    });
    expect(
      checklist.vignettes.some((item) => item.country_code === "HU")
    ).toBe(true);
  });

  it("builds checklist rows for every charge on a long Europe corridor", () => {
    const codes = ["AT", "SI", "BG", "HR", "RS", "TR"] as const;
    const tolls = codes.map((code) => getVignetteByCountryCode(code)!);
    const checklist = buildChecklist({
      countries: [...codes],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      withPet: false,
      withChildren: false,
      childrenAges: [],
      tolls,
    });
    const combined = [...checklist.vignettes, ...checklist.toll_sections];
    expect(combined).toHaveLength(6);
    expect(combined.map((item) => item.country_code).sort()).toEqual([
      "AT",
      "BG",
      "HR",
      "RS",
      "SI",
      "TR",
    ]);
    expect(
      combined.find((item) => item.country_code === "RS")?.link_label
    ).toBe("Официална информация");
    expect(
      combined.find((item) => item.country_code === "AT")?.link_label
    ).toBe("Официален магазин");
  });
});
