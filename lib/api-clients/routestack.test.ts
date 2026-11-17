import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRouteStackTokenForTests,
  describeShape,
  parseHotels,
  routeStackConfig,
  searchHotels,
  signPartnerRequest,
  tokenExpiry,
} from "@/lib/api-clients/routestack";

const config = { baseUrl: "https://x", apiKey: "key", apiSecret: "secret" };

function jwt(exp: number): string {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "HS256" })}.${part({ exp })}.sig`;
}

describe("auth helpers", () => {
  it("is off without both keys", () => {
    expect(routeStackConfig({ ROUTESTACK_API_KEY: "a" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(
      routeStackConfig({
        ROUTESTACK_API_KEY: "a",
        ROUTESTACK_API_SECRET: "b",
      } as unknown as NodeJS.ProcessEnv)?.baseUrl
    ).toBe("https://mcp.routestack.ai");
  });
  it("signs apiKey:timestamp:nonce as base64url HMAC-SHA256", () => {
    const sig = signPartnerRequest(config, 1700000000, "n1");
    expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(sig).toBe(signPartnerRequest(config, 1700000000, "n1"));
    expect(sig).not.toBe(signPartnerRequest(config, 1700000001, "n1"));
  });
  it("reads a token's expiry", () => {
    expect(tokenExpiry(jwt(1900000000))).toBe(1900000000);
    expect(tokenExpiry("garbage")).toBeNull();
  });
});

describe("parseHotels", () => {
  it("finds the list wherever it is and maps common field names", () => {
    const hotels = parseHotels({
      success: true,
      data: {
        hotels: [
          {
            hotelId: 77,
            hotelName: "Hotel Sofia",
            starRating: "4",
            price: { amount: 64.5, currency: "EUR" },
            images: [{ url: "https://img/1.jpg" }],
            bookingUrl: "https://book/77",
            address: { street: "Main 1" },
          },
          { title: "No price", pricePerNight: "39,90", currency: "BGN" },
          { noName: true },
        ],
      },
    });
    expect(hotels).toHaveLength(2);
    expect(hotels[0]).toMatchObject({
      id: "77",
      name: "Hotel Sofia",
      rating: 4,
      price: 64.5,
      currency: "EUR",
      image: "https://img/1.jpg",
      url: "https://book/77",
      address: "Main 1",
    });
    expect(hotels[1]).toMatchObject({ price: 39.9, currency: "BGN", url: null });
  });
  it("returns nothing for an unknown shape", () => {
    expect(parseHotels({ ok: true })).toEqual([]);
    expect(parseHotels(null)).toEqual([]);
  });
  it("describes shape without values", () => {
    expect(describeShape({ data: { hotels: [{ name: "Secret", price: 1 }] } })).toEqual({
      data: { hotels: { array: 1, first: { name: "string", price: "number" } } },
    });
  });
});

describe("the live response shape", () => {
  const payload = {
    success: true,
    result: {
      currency: "EUR",
      result: [
        {
          id: "39694073",
          name: "Ambasador Hotel",
          starRating: 5,
          ourprice: 88.5,
          heroImage: "https://img/a.jpg",
          distancekm: 1.4,
          payAtHotel: true,
          options: { freeBreakfast: true, refundable: false, freeCancellation: true },
          contact: { address: { line1: "Dušanova 1", city: { name: "Niš" } } },
        },
        { id: "39694073", name: "Ambasador Hotel", starRating: 5, ourprice: 79 },
        { id: "2", name: "Boutique", starRating: 3.5, ourprice: 41 },
      ],
    },
  };
  it("maps price, currency, image, address and options, one row per hotel", () => {
    const hotels = parseHotels(payload);
    expect(hotels).toHaveLength(2);
    const a = hotels.find((hotel) => hotel.id === "39694073");
    expect(a).toMatchObject({
      price: 79,
      currency: "EUR",
      rating: 5,
    });
    const rich = parseHotels({ result: { currency: "EUR", result: [payload.result.result[0]] } })[0];
    expect(rich).toMatchObject({
      image: "https://img/a.jpg",
      address: "Dušanova 1, Niš",
      free_cancellation: true,
      pay_at_hotel: true,
      free_breakfast: true,
      distance_km: 1.4,
    });
  });
});

describe("searchHotels", () => {
  beforeEach(() => clearRouteStackTokenForTests());

  it("gets a token once, then searches with it", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push(`${init.method} ${url}`);
      if (url.endsWith("/partner-token")) {
        return new Response(JSON.stringify({ token: jwt(Math.floor(Date.now() / 1000) + 3600) }));
      }
      expect((init.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
      return new Response(JSON.stringify({ hotels: [{ name: "A", price: 50 }] }));
    }) as unknown as typeof fetch;
    const query = { city: "Niš", checkIn: "2026-11-17", checkOut: "2026-11-18" };
    const first = await searchHotels(query, { config, fetchImpl });
    const second = await searchHotels(query, { config, fetchImpl });
    expect(first?.hotels[0]?.name).toBe("A");
    expect(second?.ok).toBe(true);
    expect(calls.filter((call) => call.includes("partner-token"))).toHaveLength(1);
  });

  it("is null without keys and not-ok when auth fails", async () => {
    expect(await searchHotels({ city: "x", checkIn: "a", checkOut: "b" }, { config: null })).toBeNull();
    const denied = (async () => new Response("no", { status: 401 })) as unknown as typeof fetch;
    expect(
      await searchHotels({ city: "x", checkIn: "a", checkOut: "b" }, { config, fetchImpl: denied })
    ).toEqual({ hotels: [], ok: false, error: "auth 401" });
  });
});
