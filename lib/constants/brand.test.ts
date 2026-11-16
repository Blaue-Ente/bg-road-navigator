import { describe, expect, it } from "vitest";
import { productName, productTagline } from "@/lib/constants/brand";
import { catalog } from "@/lib/i18n/locale";

describe("productName", () => {
  it("keeps Bulgarian branding in bg", () => {
    expect(productName("bg")).toBe("БГ Навигатор");
  });

  it("uses Latin branding in en/tr/ro", () => {
    expect(productName("en")).toBe("BG Road Navigator");
    expect(productName("tr")).toBe("BG Road Navigator");
    expect(productName("ro")).toBe("BG Road Navigator");
  });
});

describe("productTagline", () => {
  it("reads from the catalog per locale", () => {
    expect(productTagline("bg")).toBe(catalog("bg").brand.tagline);
    expect(productTagline("en")).toBe(catalog("en").brand.tagline);
    expect(productTagline("en")).not.toBe(catalog("bg").brand.tagline);
  });
});