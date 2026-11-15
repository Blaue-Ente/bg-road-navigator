import { describe, expect, it } from "vitest";
import { HOTSPOT_SOURCES } from "@/lib/hotspots/sources";

describe("hotspot attribution", () => {
  it("keeps the wording each publisher requires", () => {
    const text = HOTSPOT_SOURCES.map((source) => source.attribution).join("\n");
    expect(text).toContain("MUP");
    expect(text).toContain("data.gov.rs");
    expect(text).toContain(
      "https://data.gov.rs/sr/datasets/podatsi-o-saobratshajnim-nezgodama-po-politsijskim-upravama-i-opshtinama/"
    );
    expect(text).toContain("2026-11-15");
    expect(text).toContain("данните са обработени");
    expect(text).toContain(
      "Quelle: Statistische Ämter des Bundes und der Länder, Unfallatlas, dl-de/by-2-0, Daten geändert"
    );
    expect(text).toContain("Forrás: KSH (ksh.hu), CC BY 4.0. Alapadatok: ORFK");
    expect(text).toContain(
      "Datenquelle: Statistik Austria — data.statistik.gv.at"
    );
    expect(text).toContain("Zdroj: Policie ČR");
    expect(text).toContain(
      "Данни: Черна писта, chernapista.com, CC BY 4.0, по данни на МВР; данните са обработени"
    );
  });
});
