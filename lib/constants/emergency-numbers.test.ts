import { describe, expect, it } from "vitest";
import { EMERGENCY_DATA } from "@/lib/constants/emergency-numbers";

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
});