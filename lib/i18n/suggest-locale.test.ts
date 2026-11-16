import { describe, expect, it } from "vitest";
import { localeOffer } from "./suggest-locale";

describe("localeOffer", () => {
  it('orders browser-matched locales first for ["ro-RO","en"]', () => {
    expect(
      localeOffer({
        stored: null,
        dismissed: false,
        browserLanguages: ["ro-RO", "en"],
      })
    ).toEqual(["ro", "en", "tr"]);
  });

  it('returns default order for ["de-DE"]', () => {
    expect(
      localeOffer({
        stored: null,
        dismissed: false,
        browserLanguages: ["de-DE"],
      })
    ).toEqual(["en", "tr", "ro"]);
  });

  it('returns null when primary browser language is Bulgarian', () => {
    expect(
      localeOffer({
        stored: null,
        dismissed: false,
        browserLanguages: ["bg-BG", "en"],
      })
    ).toBeNull();
  });

  it("returns null when locale is already stored", () => {
    expect(
      localeOffer({
        stored: "bg",
        dismissed: false,
        browserLanguages: ["en-US"],
      })
    ).toBeNull();
  });

  it("returns null when the offer was dismissed", () => {
    expect(
      localeOffer({
        stored: null,
        dismissed: true,
        browserLanguages: ["en-US"],
      })
    ).toBeNull();
  });

  it("never includes bg in the offer list", () => {
    const offered = localeOffer({
      stored: null,
      dismissed: false,
      browserLanguages: ["tr-TR"],
    });
    expect(offered).not.toContain("bg" as never);
    expect(offered).toEqual(["tr", "en", "ro"]);
  });
});