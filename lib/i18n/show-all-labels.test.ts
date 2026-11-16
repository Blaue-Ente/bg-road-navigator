import { describe, expect, it } from "vitest";
import {
  showAllRoadNotesLabel,
  showAllWeatherLabel,
} from "@/lib/i18n/show-all-labels";

describe("showAllRoadNotesLabel", () => {
  it("formats EN at 2, 20, and 110", () => {
    expect(showAllRoadNotesLabel(2, "en")).toBe("Show all 2");
    expect(showAllRoadNotesLabel(20, "en")).toBe("Show all 20");
    expect(showAllRoadNotesLabel(110, "en")).toBe("Show all 110");
  });

  it("formats RO at 2, 20, and 110 with pluralRo", () => {
    expect(showAllRoadNotesLabel(2, "ro")).toBe("Arată toate cele 2 semnale");
    expect(showAllRoadNotesLabel(20, "ro")).toBe(
      "Arată toate cele 20 de semnale"
    );
    expect(showAllRoadNotesLabel(110, "ro")).toBe(
      "Arată toate cele 110 semnale"
    );
  });

  it("returns empty for a single hidden row", () => {
    expect(showAllRoadNotesLabel(1, "en")).toBe("");
  });

  it("formats BG and TR at 2, 20, and 110", () => {
    expect(showAllRoadNotesLabel(2, "bg")).toBe("Покажи всички 2 участъка");
    expect(showAllRoadNotesLabel(20, "bg")).toBe("Покажи всички 20 участъка");
    expect(showAllRoadNotesLabel(110, "bg")).toBe("Покажи всички 110 участъка");
    expect(showAllRoadNotesLabel(2, "tr")).toBe("Tümünü göster (2)");
    expect(showAllRoadNotesLabel(20, "tr")).toBe("Tümünü göster (20)");
    expect(showAllRoadNotesLabel(110, "tr")).toBe("Tümünü göster (110)");
  });
});

describe("showAllWeatherLabel", () => {
  it("formats EN at 2, 20, and 110", () => {
    expect(showAllWeatherLabel(2, "en")).toBe("Show all 2 segments");
    expect(showAllWeatherLabel(20, "en")).toBe("Show all 20 segments");
    expect(showAllWeatherLabel(110, "en")).toBe("Show all 110 segments");
  });

  it("formats RO at 2, 20, and 110 with pluralRo", () => {
    expect(showAllWeatherLabel(2, "ro")).toBe("Arată toate cele 2 segmente");
    expect(showAllWeatherLabel(20, "ro")).toBe(
      "Arată toate cele 20 de segmente"
    );
    expect(showAllWeatherLabel(110, "ro")).toBe(
      "Arată toate cele 110 segmente"
    );
  });

  it("formats BG and TR at 2, 20, and 110", () => {
    expect(showAllWeatherLabel(2, "bg")).toBe("Покажи всички 2 сегмента");
    expect(showAllWeatherLabel(20, "bg")).toBe("Покажи всички 20 сегмента");
    expect(showAllWeatherLabel(110, "bg")).toBe("Покажи всички 110 сегмента");
    expect(showAllWeatherLabel(2, "tr")).toBe("Tüm 2 bölümü göster");
    expect(showAllWeatherLabel(20, "tr")).toBe("Tüm 20 bölümü göster");
    expect(showAllWeatherLabel(110, "tr")).toBe("Tüm 110 bölümü göster");
  });
});