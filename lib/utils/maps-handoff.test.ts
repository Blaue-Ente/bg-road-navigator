import { describe, expect, it } from "vitest";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
} from "@/lib/utils/maps-handoff";

describe("maps handoff URLs", () => {
  const origin = { lng: 23.32, lat: 42.7 };
  const destination = { lng: 16.37, lat: 48.21 };

  it("builds a Google Maps directions link", () => {
    const url = googleMapsDirectionsUrl(origin, destination);
    expect(url).toContain("https://www.google.com/maps/dir/?");
    expect(url).toContain("origin=42.7%2C23.32");
    expect(url).toContain("destination=48.21%2C16.37");
    expect(url).toContain("travelmode=driving");
  });

  it("builds an Apple Maps directions link", () => {
    const url = appleMapsDirectionsUrl(origin, destination);
    expect(url).toContain("https://maps.apple.com/?");
    expect(url).toContain("saddr=42.7%2C23.32");
    expect(url).toContain("daddr=48.21%2C16.37");
  });
});
