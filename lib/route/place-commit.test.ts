import { describe, expect, it } from "vitest";
import { committedPlace } from "@/lib/route/place-commit";

const london = {
  id: "london",
  label: "Лондон",
  coords: { lng: -0.12, lat: 51.5 },
  source: "curated" as const,
  countryCode: "GB",
};

describe("committedPlace", () => {
  it("drops the selected city when the field text changed", () => {
    expect(committedPlace(london, "Мюнхен")).toBeNull();
  });

  it("keeps the city when the text is exactly the picked label", () => {
    expect(committedPlace(london, "Лондон")).toBe(london);
  });

  it("is empty when nothing was picked", () => {
    expect(committedPlace(null, "Пловдив")).toBeNull();
  });
});