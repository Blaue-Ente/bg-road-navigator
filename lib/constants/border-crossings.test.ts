import { describe, expect, it } from "vitest";
import {
  BORDER_CROSSINGS,
  borderDisplayName,
  borderNotesText,
} from "@/lib/constants/border-crossings";

describe("BORDER_CROSSINGS", () => {
  it("has twelve curated Bulgarian rows with full i18n metadata", () => {
    expect(BORDER_CROSSINGS).toHaveLength(12);
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
    expect(borderDisplayName("ro", row!)).toBe("Kapitan Andreevo");
  });

  it("keeps Bulgarian notes as the source of truth", () => {
    for (const row of BORDER_CROSSINGS) {
      expect(borderNotesText("bg", row)).toBe(row.notes_bg);
    }
  });
});