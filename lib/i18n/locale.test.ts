import { describe, expect, it } from "vitest";
import { catalog, parseLocale } from "@/lib/i18n/locale";
import { bg } from "@/lib/i18n/locales/bg";

describe("parseLocale", () => {
  it("keeps supported locales", () => {
    expect(parseLocale("tr")).toBe("tr");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("ro")).toBe("ro");
    expect(parseLocale("bg")).toBe("bg");
  });

  it("defaults unknown values to Bulgarian", () => {
    expect(parseLocale("de")).toBe("bg");
    expect(parseLocale("")).toBe("bg");
    expect(parseLocale(null)).toBe("bg");
  });
});

describe("catalog", () => {
  it("mirrors Bulgarian for alias locales in this PR", () => {
    expect(catalog("en").planning.calculate).toBe(bg.planning.calculate);
    expect(catalog("tr").sheet.oneRoute).toBe(bg.sheet.oneRoute);
  });

  it("never returns empty strings for known keys", () => {
    expect(catalog("ro").checklist.officialShop.length).toBeGreaterThan(0);
  });
});