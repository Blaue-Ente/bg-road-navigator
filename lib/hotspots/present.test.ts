import { describe, expect, it } from "vitest";
import {
  hotspotReason,
  hotspotWarnings,
  hotspotDetail,
} from "@/lib/hotspots/present";
import type { Hotspot } from "@/lib/hotspots/types";

const hotspot: Hotspot = {
  id: "h1",
  country: "BG",
  lng: 23,
  lat: 42,
  count: 12,
  fatal: 1,
  serious: 0,
  slight: 0,
  severity: 3,
  source_id: "bg-cherna",
  year_from: 2020,
  year_to: 2024,
};

describe("hotspot present", () => {
  it("keeps bg warning shape", () => {
    const lines = hotspotWarnings([hotspot]);
    expect(lines[0]).toContain("Участък за повишено внимание");
    expect(lines[0]).toContain("по маршрута");
  });

  it("localizes en/tr/ro without Cyrillic", () => {
    for (const locale of ["en", "tr", "ro"] as const) {
      const lines = hotspotWarnings([hotspot], locale);
      expect(lines.join(" ")).not.toMatch(/[А-Яа-яЁё]/);
      const reason = hotspotReason([hotspot], locale);
      expect(reason?.detail).not.toMatch(/[А-Яа-яЁё]/);
    }
  });

  it("uses Romanian de rule for 110 and 101", () => {
    expect(hotspotReason([hotspot, hotspot], "ro")?.detail).toContain(
      "2 sectoare"
    );
    expect(hotspotReason(Array.from({ length: 110 }, (_, i) => ({ ...hotspot, id: `h${i}` })), "ro")?.detail).toBe(
      "110 sectoare cu accidente frecvente pe ruta aleasă."
    );
    expect(hotspotReason(Array.from({ length: 101 }, (_, i) => ({ ...hotspot, id: `h${i}` })), "ro")?.detail).toBe(
      "101 sectoare cu accidente frecvente pe ruta aleasă."
    );
    expect(hotspotReason(Array.from({ length: 120 }, (_, i) => ({ ...hotspot, id: `h${i}` })), "ro")?.detail).toBe(
      "120 de sectoare cu accidente frecvente pe ruta aleasă."
    );
  });

  it("formats hotspotDetail in tr", () => {
    expect(hotspotDetail(hotspot, "tr")).toContain("12 kaza");
    expect(hotspotDetail(hotspot, "tr")).not.toMatch(/[А-Яа-яЁё]/);
  });
});