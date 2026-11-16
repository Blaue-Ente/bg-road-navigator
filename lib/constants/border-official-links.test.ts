import { describe, expect, it } from "vitest";
import {
  BG_BORDER_BULLETIN_URL,
  crossingIdForHatarinfoName,
  HATARINFO_ATTRIBUTION_TEXT,
  MFA_TRAVEL_ADVICE_URL,
  TRAVEL_ADVICE_BY_LOCALE,
  MUP_CAMERA_CROSSING_IDS,
  officialLinksForCrossing,
  OFFICIAL_LINK_LABELS,
  RO_BORDER_TRAFFIC_URL,
  RS_BORDER_CAMERAS_URL,
} from "@/lib/constants/border-official-links";

describe("official border links", () => {
  it("names the Serbian camera posts and points them at the MUP portal", () => {
    expect(MUP_CAMERA_CROSSING_IDS).toEqual(
      expect.arrayContaining(["gradina", "horgos", "presevo"])
    );
    const links = officialLinksForCrossing({
      id: "horgos",
      country_pair: "RS - HU",
    });
    expect(links).toEqual([
      {
        kind: "cameras",
        href: RS_BORDER_CAMERAS_URL,
        label_bg: OFFICIAL_LINK_LABELS.cameras.bg,
        label: OFFICIAL_LINK_LABELS.cameras,
      },
    ]);
    expect(links[0]?.href).toBe("https://www.mup.gov.rs/wps/portal/sr/kamere");
  });

  it("gives a Bulgarian crossing the bulletin and, on the Serbian side, the cameras", () => {
    expect(
      officialLinksForCrossing({ id: "kalotina", country_pair: "BG - RS" }).map(
        (link) => link.label_bg
      )
    ).toEqual(["Виж камерите", "Бюлетин на Гранична полиция"]);
    expect(
      officialLinksForCrossing({ id: "kalotina", country_pair: "BG - RS" }).map(
        (link) => link.href
      )
    ).toContain(BG_BORDER_BULLETIN_URL);
  });

  it("gives a Romanian crossing Trafic Online and keeps the Bulgarian bulletin on Ruse", () => {
    const links = officialLinksForCrossing({
      id: "danube-bridge-ruse",
      country_pair: "BG - RO",
    });
    expect(links.map((link) => link.href)).toEqual([
      BG_BORDER_BULLETIN_URL,
      RO_BORDER_TRAFFIC_URL,
    ]);
    expect(links.map((link) => link.label.bg)).toContain(
      OFFICIAL_LINK_LABELS.romania.bg
    );
  });

  it("does not invent a link for a crossing with no official page in the map", () => {
    expect(
      officialLinksForCrossing({ id: "gorican", country_pair: "HR - HU" })
    ).toEqual([]);
  });

  it("exposes consular travel links per locale", () => {
    expect(TRAVEL_ADVICE_BY_LOCALE.bg.href).toBe(MFA_TRAVEL_ADVICE_URL);
    expect(TRAVEL_ADVICE_BY_LOCALE.en.href).toBe("https://europa.eu/youreurope/");
    expect(TRAVEL_ADVICE_BY_LOCALE.ro.href).toBe("https://www.mae.ro/");
    expect(TRAVEL_ADVICE_BY_LOCALE.tr.href).toBe("https://www.mfa.gov.tr/");
  });

  it("keeps the MFA advice URL and the Hárinfó attribution string", () => {
    expect(MFA_TRAVEL_ADVICE_URL).toBe(
      "https://www.mfa.bg/bg/uslugi-patuvania/konsulski-uslugi/patuvane-chujbina"
    );
    expect(HATARINFO_ATTRIBUTION_TEXT).toBe(
      "Източник: Унгарска полиция (Hárinfó)"
    );
  });

  it("maps the published Hungarian names onto crossing ids", () => {
    expect(crossingIdForHatarinfoName("Röszke - Horgoš autópálya")).toBe(
      "horgos"
    );
    expect(crossingIdForHatarinfoName("Röszke - Horgoš közút")).toBe(
      "horgos-road"
    );
    expect(crossingIdForHatarinfoName("Tompa - Kelebia")).toBe("tompa");
    expect(crossingIdForHatarinfoName("Hercegszántó - Backi Breg")).toBe(
      "hercegszanto"
    );
    expect(crossingIdForHatarinfoName("Bácsszentgyörgy–Raština")).toBe(
      "bacsszentgyorgy"
    );
    expect(crossingIdForHatarinfoName("Tiszasziget - Đala")).toBe("tiszasziget");
    expect(crossingIdForHatarinfoName("Kübekháza - Rabe (Rábé)")).toBe(
      "kubehaza"
    );
  });
});
