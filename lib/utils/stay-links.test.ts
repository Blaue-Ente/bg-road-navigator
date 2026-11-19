import { describe, expect, it } from "vitest";
import {
  airbnbSearchUrl,
  bookingSearchUrl,
  googleMapsHotelsUrl,
  tripadvisorSearchUrl,
} from "@/lib/utils/stay-links";

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

describe("party size in the Booking link", () => {
  it("passes the children's ages and rooms for the adults", () => {
    const url = new URL(
      bookingSearchUrl({ ...query, adults: 4, children: 2, childAges: [9, 3] })
    );
    expect(url.searchParams.getAll("age")).toEqual(["9", "3"]);
    expect(url.searchParams.get("no_rooms")).toBe("2");
    expect(url.searchParams.get("group_adults")).toBe("4");
  });

  it("uses one room for up to two adults", () => {
    expect(new URL(bookingSearchUrl({ ...query, adults: 2 })).searchParams.get("no_rooms")).toBe("1");
  });
});

describe("travelling with a pet", () => {
  it("asks for pet-friendly places on each platform", () => {
    expect(new URL(bookingSearchUrl({ ...query, pets: true })).searchParams.get("nflt")).toBe(
      "hotelfacility=4"
    );
    expect(new URL(airbnbSearchUrl({ ...query, pets: true })).searchParams.get("pets")).toBe("1");
    expect(decodeURIComponent(tripadvisorSearchUrl({ ...query, pets: true }))).toContain(
      "pet friendly hotels Arad"
    );
    expect(decodeURIComponent(googleMapsHotelsUrl({ ...query, pets: true }))).toContain(
      "pet friendly hotels near"
    );
  });

  it("adds nothing without a pet", () => {
    expect(new URL(bookingSearchUrl(query)).searchParams.has("nflt")).toBe(false);
    expect(new URL(airbnbSearchUrl(query)).searchParams.has("pets")).toBe(false);
  });
});
