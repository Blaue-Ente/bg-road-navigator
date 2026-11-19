import { describe, expect, it } from "vitest";
import { pickText } from "@/lib/i18n/localized-field";
import { EUROPEAN_BORDER_NOTES } from "@/lib/constants/european-border-notes";
import {
  BORDER_CROSSINGS,
  borderDisplayName,
  borderNotesText,
  bucharestSofiaCorridorDescription,
  danubeBridgeShortNote,
} from "@/lib/constants/border-crossings";
import { corridorDescription } from "@/lib/constants/european-corridors";

describe("BORDER_CROSSINGS", () => {
  it("has seventeen curated Bulgarian rows with full i18n metadata", () => {
    expect(BORDER_CROSSINGS).toHaveLength(17);
    for (const row of BORDER_CROSSINGS) {
      expect(row.notes?.bg).toBe(row.notes_bg);
      expect(row.document_codes?.length).toBeGreaterThan(0);
      expect(row.vehicle_codes?.length).toBeGreaterThan(0);
      expect(row.notes?.en?.trim()).toBeTruthy();
      expect(row.notes?.tr?.trim()).toBeTruthy();
      expect(row.notes?.ro?.trim()).toBeTruthy();
    }
  });

  it("uses Latin exonyms for non-Bulgarian locales", () => {
    const kalotina = BORDER_CROSSINGS.find((row) => row.id === "kalotina");
    expect(kalotina).toBeDefined();
    expect(borderDisplayName("bg", kalotina!)).toBe("Калотина");
    expect(borderDisplayName("tr", kalotina!)).toBe("Kalotina");
    expect(borderDisplayName("en", kalotina!)).toBe("Kalotina");
    expect(borderDisplayName("ro", kalotina!)).toBe("Kalotina");
  });

  it("shows Kapıkule in Turkish for Kapitan Andreevo", () => {
    const row = BORDER_CROSSINGS.find((row) => row.id === "kapitan-andreevo");
    expect(borderDisplayName("tr", row!)).toBe("Kapıkule");
    expect(borderDisplayName("ro", row!)).toBe("Capitan Andreevo");
  });

  it("localizes Danube bridges consistently in en, tr and ro", () => {
    const vidin = BORDER_CROSSINGS.find((row) => row.id === "danube-bridge-vidin");
    expect(borderDisplayName("en", vidin!)).toBe("Danube Bridge Vidin–Calafat");
    expect(borderDisplayName("tr", vidin!)).toBe("Tuna Köprüsü Vidin–Calafat");
    expect(borderDisplayName("ro", vidin!)).toBe("Podul Dunărea Vidin–Calafat");
    expect(borderDisplayName("tr", vidin!)).not.toMatch(/\b(Danube|Bridge)\b/i);
    expect(borderDisplayName("tr", vidin!)).not.toMatch(/Tuna köprüsü/);
    const ruse = BORDER_CROSSINGS.find((row) => row.id === "danube-bridge-ruse");
    expect(borderDisplayName("en", ruse!)).toBe("Danube Bridge Ruse–Giurgiu");
    expect(borderDisplayName("tr", ruse!)).toBe("Tuna Köprüsü Ruse–Giurgiu");
    expect(borderDisplayName("ro", ruse!)).toBe("Podul Dunărea Ruse–Giurgiu");
    expect(borderDisplayName("tr", ruse!)).not.toContain("Rusçuk");
  });

  it("keeps Liubotenet and Bucharest corridor notes aligned with Danube bridge names", () => {
    for (const locale of ["en", "tr", "ro"] as const) {
      expect(danubeBridgeShortNote("danube-bridge-vidin", locale)).toBe(
        `${borderDisplayName(locale, BORDER_CROSSINGS.find((r) => r.id === "danube-bridge-vidin")!)}.`
      );
      expect(pickText(locale, EUROPEAN_BORDER_NOTES.liubotenet)).toBe(
        danubeBridgeShortNote("danube-bridge-vidin", locale)
      );
      expect(corridorDescription("bucharest-sofia", locale)).toBe(
        bucharestSofiaCorridorDescription(locale)
      );
      expect(corridorDescription("bucharest-sofia", locale)).toContain(
        borderDisplayName(locale, BORDER_CROSSINGS.find((r) => r.id === "danube-bridge-vidin")!)
      );
      expect(corridorDescription("bucharest-sofia", locale)).toContain("Ruse");
    }
  });

  it("keeps Bulgarian notes as the source of truth", () => {
    for (const row of BORDER_CROSSINGS) {
      expect(borderNotesText("bg", row)).toBe(row.notes_bg);
    }
  });
});