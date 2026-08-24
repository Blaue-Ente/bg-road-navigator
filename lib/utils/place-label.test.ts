import { describe, expect, it } from "vitest";
import { formatPlaceInputValue } from "@/lib/utils/place-label";

describe("formatPlaceInputValue", () => {
  it("joins street label with city subtitle", () => {
    expect(
      formatPlaceInputValue({
        id: "a",
        label: "улица Патриарх Евтимий 15",
        subtitle: "София, 1000, България",
        coords: { lng: 23.32, lat: 42.69 },
        source: "geocoder",
      })
    ).toBe("улица Патриарх Евтимий 15, София, 1000, България");
  });

  it("does not duplicate when subtitle is already in the label", () => {
    expect(
      formatPlaceInputValue({
        id: "b",
        label: "София",
        subtitle: "София",
        coords: { lng: 23.32, lat: 42.7 },
        source: "curated",
      })
    ).toBe("София");
  });
});
