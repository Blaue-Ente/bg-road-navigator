import { describe, expect, it } from "vitest";
import { nearbyStays, rankStays, siteReferer, tripadvisorKey } from "@/lib/api-clients/tripadvisor";
import {
  airbnbSearchUrl,
  bookingSearchUrl,
  nextDay,
} from "@/lib/utils/stay-links";

describe("rankStays", () => {
  it("drops unrated or unlinked rows and prefers well-reviewed places", () => {
    const rows = rankStays([
      { id: "a", name: "A", rating: 5, reviews: 2, price_level: null, url: "u", distance_km: 1 },
      { id: "b", name: "B", rating: 4.5, reviews: 800, price_level: null, url: "u", distance_km: 2 },
      { id: "c", name: "C", rating: null, reviews: 10, price_level: null, url: "u", distance_km: 1 },
      { id: "d", name: "D", rating: 4, reviews: 100, price_level: null, url: null, distance_km: 1 },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["b", "a"]);
  });
});

describe("tripadvisorKey", () => {
  it("accepts the documented name and the Traveler-API spellings", () => {
    const env = (value: Record<string, string>) => value as unknown as NodeJS.ProcessEnv;
    expect(tripadvisorKey(env({}))).toBeNull();
    expect(tripadvisorKey(env({ TRIPADVISOR_API_KEY: "a" }))).toBe("a");
    expect(tripadvisorKey(env({ TRIPADVISOR_TRAVELER_API: " b " }))).toBe("b");
    expect(tripadvisorKey(env({ TRIPADVISOR_TRAVALER_API: "c" }))).toBe("c");
    expect(tripadvisorKey(env({ TRIPADVISOR_API: "d" }))).toBe("d");
    expect(tripadvisorKey(env({ TRIPADVISOR_WHATEVER: "ABCDEF0123456789ABCDEF" }))).toBe(
      "ABCDEF0123456789ABCDEF"
    );
    expect(tripadvisorKey(env({ TRIPADVISOR_NOTE: "not a key" }))).toBeNull();
  });
});

describe("siteReferer", () => {
  it("uses the public app address, else the Vercel production domain", () => {
    const env = (value: Record<string, string>) => value as unknown as NodeJS.ProcessEnv;
    expect(siteReferer(env({ NEXT_PUBLIC_APP_URL: "https://x.app/" }))).toBe("https://x.app");
    expect(siteReferer(env({ VERCEL_PROJECT_PRODUCTION_URL: "y.vercel.app" }))).toBe(
      "https://y.vercel.app"
    );
    expect(siteReferer(env({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" }))).toBeNull();
  });
});

describe("nearbyStays", () => {
  it("is null without a key and reads search then details", async () => {
    expect(await nearbyStays({ lat: 1, lng: 1 }, { key: null })).toBeNull();
    const fetchImpl = (async (url: string) => {
      const body = url.includes("nearby_search")
        ? { data: [{ location_id: "7", name: "Hotel Seven", distance: "1.2" }] }
        : { rating: "4.5", num_reviews: "321", price_level: "$$", web_url: "https://tripadvisor.example/7" };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as unknown as typeof fetch;
    const rows = await nearbyStays({ lat: 43, lng: 21 }, { key: "k", fetchImpl });
    expect(rows).toEqual([
      {
        id: "7",
        name: "Hotel Seven",
        rating: 4.5,
        reviews: 321,
        price_level: "$$",
        url: "https://tripadvisor.example/7",
        distance_km: 1.2,
      },
    ]);
  });
  it("is null when the service fails", async () => {
    const down = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
    expect(await nearbyStays({ lat: 1, lng: 1 }, { key: "k", fetchImpl: down })).toBeNull();
  });
});

describe("stay links", () => {
  const query = {
    place: "Niš, Serbia",
    lat: 43.32,
    lng: 21.9,
    checkin: "2026-11-17",
    checkout: "2026-11-18",
    adults: 2,
    children: 1,
  };
  it("adds the partner id only when set", () => {
    expect(bookingSearchUrl(query)).not.toContain("aid=");
    expect(bookingSearchUrl(query, "123")).toContain("aid=123");
    expect(bookingSearchUrl(query)).toContain("group_children=1");
  });
  it("builds an Airbnb search and the next day", () => {
    expect(airbnbSearchUrl(query)).toContain("/s/Ni%C5%A1%2C%20Serbia/homes");
    expect(nextDay("2026-11-30")).toBe("2026-12-01");
  });
});
