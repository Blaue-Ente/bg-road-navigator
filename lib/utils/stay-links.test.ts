import { describe, expect, it } from "vitest";
import { airbnbSearchUrl, bookingSearchUrl } from "@/lib/utils/stay-links";

const query = {
  place: "Arad, Romania",
  lat: 46.18,
  lng: 21.31,
  checkin: "2026-12-19",
  checkout: "2026-12-20",
  adults: 2,
  children: 1,
};

describe("stay links", () => {
  it("searches Booking around the point, by town name", () => {
    const url = new URL(bookingSearchUrl(query));
    expect(url.searchParams.get("ss")).toBe("Arad, Romania");
    expect(url.searchParams.get("dest_type")).toBe("latlong");
    expect(url.searchParams.get("latitude")).toBe("46.18000");
    expect(url.searchParams.get("group_children")).toBe("1");
    expect(url.searchParams.has("aid")).toBe(false);
  });

  it("puts the partner id on the link only when given", () => {
    expect(new URL(bookingSearchUrl(query, " 123 ")).searchParams.get("aid")).toBe("123");
  });

  it("names the town in the Airbnb path", () => {
    expect(airbnbSearchUrl(query)).toContain("/s/Arad%2C%20Romania/homes");
  });
});
