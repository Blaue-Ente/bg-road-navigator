import { describe, expect, it } from "vitest";
import { timeZoneLabel, timeZoneLabelBg } from "@/lib/geo/country-timezone";

describe("timeZoneLabel", () => {
  it("keeps Bulgarian labels via timeZoneLabelBg", () => {
    expect(timeZoneLabelBg("Europe/Belgrade")).toBe("Белград");
    expect(timeZoneLabel("Europe/Belgrade", "bg")).toBe("Белград");
  });

  it("returns localized city names", () => {
    expect(timeZoneLabel("Europe/Belgrade", "tr")).toBe("Belgrad");
    expect(timeZoneLabel("Europe/Vienna", "en")).toBe("Vienna");
    expect(timeZoneLabel("Europe/Bucharest", "ro")).toBe("București");
  });

  it("falls back to catalog local time label", () => {
    expect(timeZoneLabel("America/New_York", "en")).toMatch(/local time/i);
  });
});