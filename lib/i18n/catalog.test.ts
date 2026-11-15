import { describe, expect, it } from "vitest";
import { CYRILLIC } from "@/lib/i18n/catalog-test-utils";
import { bg } from "@/lib/i18n/locales/bg";
import { en } from "@/lib/i18n/locales/en";
import { ro } from "@/lib/i18n/locales/ro";
import { tr } from "@/lib/i18n/locales/tr";

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

describe("locale catalogs", () => {
  const bgFlat = flatten(bg);

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

  it("non-bg catalogs differ from bg when bg contains Cyrillic", () => {
    const enFlat = flatten(en);
    for (const [path, value] of Object.entries(bgFlat)) {
      if (!CYRILLIC.test(value)) continue;
      expect(enFlat[path], `en missing ${path}`).not.toBe(value);
    }
  });
});