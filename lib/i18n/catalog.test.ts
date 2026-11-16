import { describe, expect, it } from "vitest";
import { CYRILLIC, EN_TRANSLIT_MARKERS } from "@/lib/i18n/catalog-test-utils";
import { catalog } from "@/lib/i18n/locale";
import { bg } from "@/lib/i18n/locales/bg";
import { en } from "@/lib/i18n/locales/en";
import { ro } from "@/lib/i18n/locales/ro";
import { tr } from "@/lib/i18n/locales/tr";
import enByBg from "@/lib/i18n/locales/translations/en-by-bg.json";
import trByBg from "@/lib/i18n/locales/translations/tr-by-bg.json";
import roByBg from "@/lib/i18n/locales/translations/ro-by-bg.json";

function flatten(obj: object, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else if (value && typeof value === "object")
      Object.assign(out, flatten(value, path));
  }
  return out;
}

function countCyrillic(values: Iterable<string>): number {
  let n = 0;
  for (const value of values) {
    if (CYRILLIC.test(value)) n += 1;
  }
  return n;
}

describe("locale catalogs", () => {
  const bgFlat = flatten(bg);
  const catalogs = { en, tr, ro } as const;

  it("does not leave the Bulgarian calculate label in other catalogs", () => {
    expect(en.planning.calculate).not.toBe("Изчисли маршрут");
    expect(tr.planning.calculate).not.toBe("Изчисли маршрут");
    expect(ro.planning.calculate).not.toBe("Изчисли маршрут");
    expect(en.sheet.oneRoute).not.toBe(bg.sheet.oneRoute);
    expect(tr.sheet.oneRoute).not.toBe(bg.sheet.oneRoute);
    expect(ro.sheet.oneRoute).not.toBe(bg.sheet.oneRoute);
    expect(en.checklist.officialInfo).not.toBe("Официална информация");
    expect(tr.checklist.officialInfo).not.toBe("Официална информация");
    expect(ro.checklist.officialInfo).not.toBe("Официална информация");
  });

  it("uses the Bulgarian wording Гранични пунктове, not Serbian пролази", () => {
    const values = Object.values(bgFlat);
    expect(values).toContain("Гранични пунктове");
    expect(values.some((v) => v.includes("пролази"))).toBe(false);
  });

  for (const [locale, catalog] of [
    ["en", en],
    ["tr", tr],
    ["ro", ro],
  ] as const) {
    it(`${locale} has the same key paths as bg`, () => {
      expect(Object.keys(flatten(catalog)).sort()).toEqual(
        Object.keys(bgFlat).sort()
      );
    });
  }

  it("en/tr/ro catalog values contain no Cyrillic", () => {
    expect(countCyrillic(Object.values(flatten(en)))).toBe(0);
    expect(countCyrillic(Object.values(flatten(tr)))).toBe(0);
    expect(countCyrillic(Object.values(flatten(ro)))).toBe(0);
  });

  it("en/tr/ro map values contain no Cyrillic", () => {
    expect(countCyrillic(Object.values(enByBg))).toBe(0);
    expect(countCyrillic(Object.values(trByBg))).toBe(0);
    expect(countCyrillic(Object.values(roByBg))).toBe(0);
  });

  it("non-bg catalogs differ from bg when bg contains Cyrillic", () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      const flat = flatten(catalog);
      for (const [path, value] of Object.entries(bgFlat)) {
        if (!CYRILLIC.test(value)) continue;
        expect(flat[path], `${locale} identical to bg at ${path}`).not.toBe(
          value
        );
      }
    }
  });

  it("en values contain no transliteration markers", () => {
    const hits: string[] = [];
    for (const [path, value] of Object.entries(flatten(en))) {
      if (EN_TRANSLIT_MARKERS.test(value)) hits.push(`${path}: ${value}`);
    }
    expect(hits).toEqual([]);
  });

  it("resolves nav homonyms via per-key overrides", () => {
    expect(catalog("tr").nav.weather).toBe("Hava durumu");
    expect(catalog("en").nav.weather).toBe("Weather");
    expect(catalog("ro").nav.weather).toBe("Vremea");
    expect(catalog("tr").nav.hotels).toBe("Dinlenme yerleri");
    expect(catalog("en").nav.hotels).toBe("Rest stops");
    expect(tr.sheet.weather).not.toBe(catalog("tr").nav.weather);
  });

  it("fixes the previously broken sample strings", () => {
    expect(en.locale.switch).toBe("Language");
    expect(tr.locale.switch).toBe("Dil");
    expect(ro.locale.switch).toBe("Limbă");
    expect(en.home.waitNow).toBe("Wait now");
    expect(tr.home.waitNow).toBe("Şimdiki bekleme");
    expect(ro.home.waitNow).toBe("Așteptare acum");
    expect(tr.map.legend).toBe("Harita açıklaması");
    expect(tr.planning.via).toBe("Ara nokta (isteğe bağlı)");
    expect(en.planning.saveSettings).toBe("Save as my defaults");
    expect(tr.planning.saveSettings).toBe("Varsayılanlarım olarak kaydet");
    expect(ro.planning.saveSettings).toBe("Salvează ca setările mele");
    expect(en.community.msg0bec2e932c).toBe("Cancel");
    expect(tr.community.msg0bec2e932c).toBe("Vazgeç");
    expect(ro.community.msg0bec2e932c).toBe("Anulează");
    expect(en.routePage.msgfe32ebb56c).toBe("Fuel along the route");
    expect(tr.routePage.msgfe32ebb56c).toBe("Güzergâh boyunca yakıt");
    expect(ro.routePage.msgfe32ebb56c).toBe("Combustibil pe traseu");
    expect(en.location.msgc92ced4d4f).toBe("Warnings while driving");
    expect(tr.location.msgc92ced4d4f).toBe("Yolda uyarılar");
    expect(ro.location.msgc92ced4d4f).toBe("Avertizări în timpul drumului");
  });
});
