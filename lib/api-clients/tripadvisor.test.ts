import { beforeEach, describe, expect, it } from "vitest";
import {
  nearbyStays,
  rankStays,
  resetDailyCalls,
  resultSize,
  toStay,
  tripadvisorKey,
  type TripadvisorStay,
} from "@/lib/api-clients/tripadvisor";
import {
  airbnbSearchUrl,
  bookingSearchUrl,
  nextDay,
} from "@/lib/utils/stay-links";

const stay = (over: Partial<TripadvisorStay>): TripadvisorStay => ({
  id: "x",
  name: "X",
  rating: 4,
  reviews: 100,
  rating_icon_url: null,
  url: "https://www.tripadvisor.com/x",
  distance_km: 1,
  address: null,
  ...over,
});

describe("rankStays", () => {
  it("drops unrated or unlinked rows and prefers well-reviewed places", () => {
    const rows = rankStays([
      stay({ id: "a", name: "A", rating: 5, reviews: 2 }),
      stay({ id: "b", name: "B", rating: 4.5, reviews: 800 }),
      stay({ id: "c", name: "C", rating: null, reviews: 10 }),
      stay({ id: "d", name: "D", rating: 4, reviews: 100, url: null }),
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

describe("toStay", () => {
  it("reads the Terra catalog shape and prefers the primary name", () => {
    expect(
      toStay({
        distance_kilometers: 2.4,
        location: {
          id: 7,
          names: [
            { language: "bg", value: "Хотел Седем" },
            { language: "en", value: "Hotel Seven", primary: true },
          ],
          addresses: [{ formatted: "1 Main St, Niš" }],
          overall_rating: {
            count: 321,
            rating: 4.5,
            icon_url: "https://www.tripadvisor.com/img/4.5.svg",
          },
          urls: { tripadvisor: { main: "https://www.tripadvisor.com/Hotel_Review-7" } },
        },
      })
    ).toEqual({
      id: "7",
      name: "Hotel Seven",
      rating: 4.5,
      reviews: 321,
      rating_icon_url: "https://www.tripadvisor.com/img/4.5.svg",
      url: "https://www.tripadvisor.com/Hotel_Review-7",
      distance_km: 2.4,
      address: "1 Main St, Niš",
    });
  });
  it("codes against absent fields and refuses non-https links", () => {
    expect(toStay({})).toBeNull();
    const row = toStay({
      location: {
        id: 9,
        names: [{ value: "Nine" }],
        urls: { tripadvisor: { main: "javascript:alert(1)" } },
        overall_rating: { icon_url: "http://insecure.example/x.svg" },
      },
    });
    expect(row?.url).toBeNull();
    expect(row?.rating_icon_url).toBeNull();
    expect(row?.rating).toBeNull();
  });
});

describe("nearbyStays", () => {
  beforeEach(() => resetDailyCalls());

  const catalog = {
    data: [
      {
        distance_kilometers: 1.2,
        location: {
          id: 7,
          names: [{ value: "Hotel Seven", primary: true }],
          overall_rating: { count: 321, rating: 4.5 },
          urls: { tripadvisor: { main: "https://www.tripadvisor.com/Hotel_Review-7" } },
        },
      },
    ],
  };

  it("is null without a key", async () => {
    expect(await nearbyStays({ lat: 1, lng: 1 }, { key: null })).toBeNull();
  });

  it("calls the Terra catalog with the key in a header, never in the URL, and never caches", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify(catalog), { status: 200 });
    }) as unknown as typeof fetch;
    const rows = await nearbyStays(
      { lat: 43.3209, lng: 21.8958, radiusKm: 50 },
      { key: "secret-key", fetchImpl, size: 4 }
    );
    expect(rows?.map((row) => row.name)).toEqual(["Hotel Seven"]);
    const url = new URL(seen!.url);
    expect(url.origin + url.pathname).toBe(
      "https://terra.tripadvisor.com/api/catalog/locations/nearby"
    );
    expect(url.searchParams.get("version")).toBe("1");
    expect(url.searchParams.get("category")).toBe("HOTEL");
    expect(url.searchParams.get("unit")).toBe("KM");
    expect(url.searchParams.get("radius")).toBe("8");
    expect(url.searchParams.get("size")).toBe("4");
    expect(seen!.url).not.toContain("secret-key");
    expect((seen!.init.headers as Record<string, string>)["X-API-Key"]).toBe("secret-key");
    expect(seen!.init.cache).toBe("no-store");
  });

  it("reports the status and message of a refusal without the key", async () => {
    const forbidden = (async () =>
      new Response(JSON.stringify({ detail: "API Key does not have access to endpoint" }), {
        status: 403,
      })) as unknown as typeof fetch;
    const errors: string[] = [];
    expect(
      await nearbyStays(
        { lat: 1, lng: 1 },
        { key: "k", fetchImpl: forbidden, onError: (message) => errors.push(message) }
      )
    ).toBeNull();
    expect(errors).toEqual(["403 API Key does not have access to endpoint"]);
  });

  it("is null when the service fails", async () => {
    const down = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
    expect(await nearbyStays({ lat: 1, lng: 1 }, { key: "k", fetchImpl: down })).toBeNull();
  });

  it("stops asking once the daily ceiling is reached", async () => {
    const ok = (async () =>
      new Response(JSON.stringify(catalog), { status: 200 })) as unknown as typeof fetch;
    const errors: string[] = [];
    const previous = process.env.TRIPADVISOR_DAILY_LIMIT;
    process.env.TRIPADVISOR_DAILY_LIMIT = "2";
    try {
      expect(await nearbyStays({ lat: 1, lng: 1 }, { key: "k", fetchImpl: ok })).not.toBeNull();
      expect(await nearbyStays({ lat: 1, lng: 1 }, { key: "k", fetchImpl: ok })).not.toBeNull();
      expect(
        await nearbyStays(
          { lat: 1, lng: 1 },
          { key: "k", fetchImpl: ok, onError: (message) => errors.push(message) }
        )
      ).toBeNull();
      expect(errors[0]).toContain("daily call limit");
    } finally {
      if (previous === undefined) delete process.env.TRIPADVISOR_DAILY_LIMIT;
      else process.env.TRIPADVISOR_DAILY_LIMIT = previous;
    }
  });
});

describe("resultSize", () => {
  it("defaults small to limit billing and clamps to Terra's page size", () => {
    const env = (value: Record<string, string>) => value as unknown as NodeJS.ProcessEnv;
    expect(resultSize(env({}))).toBe(6);
    expect(resultSize(env({ TRIPADVISOR_RESULT_SIZE: "3" }))).toBe(3);
    expect(resultSize(env({ TRIPADVISOR_RESULT_SIZE: "500" }))).toBe(20);
    expect(resultSize(env({ TRIPADVISOR_RESULT_SIZE: "0" }))).toBe(1);
    expect(resultSize(env({ TRIPADVISOR_RESULT_SIZE: "abc" }))).toBe(6);
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
