import { describe, expect, it } from "vitest";
import { EMERGENCY_DATA } from "@/lib/constants/emergency-numbers";
import { countryName } from "@/lib/geo/country-name";
import { pickText } from "@/lib/i18n/localized-field";

/** Verified phone numbers before PR 14 — must not drift in locale work. */
const PHONE_SNAPSHOT: Array<
  [
    string,
    string,
    string,
    string,
    string,
    string,
  ]
> = [
  ["BG", "166", "150", "160", "112", "112"],
  ["GR", "100", "166", "199", "179", "179"],
  ["TR", "155", "112", "112", "112", "112"],
  ["RS", "112", "112", "112", "112", "112"],
  ["MK", "112", "112", "112", "112", "112"],
  ["RO", "112", "112", "112", "112", "112"],
  ["HU", "112", "112", "112", "112", "112"],
  ["AT", "112", "112", "112", "112", "112"],
  ["DE", "112", "112", "112", "112", "112"],
  ["IT", "112", "112", "112", "112", "112"],
  ["FR", "112", "112", "112", "112", "112"],
  ["ES", "112", "112", "112", "112", "112"],
  ["PT", "112", "112", "112", "112", "112"],
  ["SI", "112", "112", "112", "112", "112"],
  ["HR", "112", "112", "112", "112", "112"],
  ["BA", "112", "112", "112", "112", "112"],
  ["ME", "112", "112", "112", "112", "112"],
  ["AL", "112", "112", "112", "112", "112"],
  ["CH", "112", "112", "112", "112", "112"],
  ["NL", "112", "112", "112", "112", "112"],
  ["BE", "112", "112", "112", "112", "112"],
  ["LU", "112", "112", "112", "112", "112"],
  ["CZ", "112", "112", "112", "112", "112"],
  ["SK", "112", "112", "112", "112", "112"],
  ["PL", "112", "112", "112", "112", "112"],
  ["UA", "112", "112", "112", "112", "112"],
  ["MD", "112", "112", "112", "112", "112"],
];

describe("emergency vignette notes", () => {
  it("does not use the Russian spelling or claim a Serbian vignette", () => {
    const blob = EMERGENCY_DATA.map((row) => row.notes_bg).join("\n");
    expect(blob).not.toContain("виньетка");
    expect(
      EMERGENCY_DATA.find((row) => row.country === "Serbia")?.notes_bg
    ).toMatch(/Няма винетка/);
    expect(
      EMERGENCY_DATA.find((row) => row.country === "North Macedonia")?.notes_bg
    ).not.toMatch(/ЕС граждани/);
  });

  it("points Bulgaria purchases at the official shop host", () => {
    expect(
      EMERGENCY_DATA.find((row) => row.country === "Bulgaria")?.notes_bg
    ).toContain("https://web.bgtoll.bg/");
  });

  it("keeps every emergency phone number unchanged", () => {
    const live = EMERGENCY_DATA.map(
      (row) =>
        [
          row.country_code,
          row.police,
          row.ambulance,
          row.fire,
          row.roadside_assistance,
          row.towing_service,
        ] as const
    );
    expect(live).toEqual(PHONE_SNAPSHOT);
  });

  it("mirrors Bulgarian notes on notes.bg", () => {
    for (const row of EMERGENCY_DATA) {
      expect(row.notes.bg).toBe(row.notes_bg);
    }
  });

  it("uses ISO country codes for every row", () => {
    expect(EMERGENCY_DATA.map((row) => row.country_code).sort()).toEqual(
      PHONE_SNAPSHOT.map(([code]) => code).sort()
    );
  });

  it("renders Greek roadside branding in Greek script (not Cyrillic)", () => {
    const greece = EMERGENCY_DATA.find((row) => row.country_code === "GR");
    expect(greece?.roadside_name.en).toBe("Ελληνική Ασφάλεια");
    expect(countryName("GR", "en")).toBe("Greece");
  });

  it("keeps roadside 112 for Bulgaria with an honest roadside label", () => {
    const bg = EMERGENCY_DATA.find((row) => row.country_code === "BG");
    expect(bg?.roadside_assistance).toBe("112");
    expect(pickText("en", bg!.roadside_name)).toContain("112");
    expect(pickText("en", bg!.roadside_name)).toMatch(/146|motor club/i);
  });

});