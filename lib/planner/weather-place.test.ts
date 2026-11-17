import { describe, expect, it } from "vitest";
import {
  placesForSamples,
  weatherPlaceLabel,
} from "@/lib/planner/weather-place";

describe("weatherPlaceLabel", () => {
  it("joins the locality and the country", () => {
    expect(
      weatherPlaceLabel(
        {
          label: "E75",
          subtitle: "Niš, Nišava District, Serbia",
          countryCode: "RS",
        },
        null,
        "en"
      )
    ).toBe("Niš, Serbia");
  });

  it("falls back to the country when nothing was found", () => {
    expect(weatherPlaceLabel(null, "HU", "en")).toBe("Hungary");
  });

  it("returns null with no place and no country", () => {
    expect(weatherPlaceLabel(null, null, "en")).toBeNull();
  });
});

describe("placesForSamples", () => {
  it("uses the lookup result and the country on failure", async () => {
    const places = await placesForSamples(
      [
        { lat: 43.32, lng: 21.9 },
        { lat: 47.5, lng: 19.04 },
      ],
      "en",
      async (lat) =>
        lat < 45
          ? {
              id: "x",
              label: "Niš",
              subtitle: "Serbia",
              coords: { lng: 21.9, lat: 43.32 },
              source: "geocoder",
              countryCode: "RS",
            }
          : null
    );
    expect(places[0]).toBe("Niš, Serbia");
    expect(places[1]).toBe("Hungary");
  });
});
