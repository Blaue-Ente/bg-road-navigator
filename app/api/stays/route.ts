import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stayWhy } from "@/lib/ai/stay-why";
import { aiConfig } from "@/lib/ai/provider";
import { reversePlace } from "@/lib/api-clients/geocoding";
import { nearbyStays, tripadvisorKey } from "@/lib/api-clients/tripadvisor";
import {
  routeStackConfig,
  searchHotels,
  type RouteStackResult,
} from "@/lib/api-clients/routestack";
import { cachedValue, minutesFromEnv } from "@/lib/cache/shared-cache";
import { weatherPlaceLabel } from "@/lib/planner/weather-place";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";
import { EuropePointSchema } from "@/lib/server/geo-schema";
import {
  airbnbSearchUrl,
  bookingSearchUrl,
  isoDay,
  nextDay,
} from "@/lib/utils/stay-links";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const QuerySchema = z.object({
  place: z.string().trim().max(120).optional(),
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.coerce.number().int().min(1).max(8).default(2),
  children: z.coerce.number().int().min(0).max(6).default(0),
  locale: z.enum(["bg", "en", "tr", "ro"]).default("bg"),
  pet: z.enum(["0", "1"]).default("0"),
  debug: z.enum(["0", "1"]).default("0"),
});

/**
 * Where to sleep near a point: Tripadvisor ratings when a key is set, an AI
 * paragraph on which suits the traveller (only from those ratings), and search
 * links to Booking.com and Airbnb. Booking links are partner links only when
 * BOOKING_AFFILIATE_ID is set.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(`stays:${clientIpFromHeaders(request.headers)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  const params = request.nextUrl.searchParams;
  const point = EuropePointSchema.safeParse({
    lng: Number(params.get("lng")),
    lat: Number(params.get("lat")),
  });
  const query = QuerySchema.safeParse(Object.fromEntries(params));
  if (!point.success || !query.success) {
    return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 });
  }
  const { lng, lat } = point.data;
  const q = query.data;

  const found = await Promise.race([
    reversePlace(lat, lng, { lang: q.locale }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3_500)),
  ]).catch(() => null);
  const place =
    q.place || weatherPlaceLabel(found, null, q.locale) || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

  const checkin = q.checkin ?? isoDay(new Date());
  const stayQuery = {
    place,
    lat,
    lng,
    checkin,
    checkout: nextDay(checkin),
    adults: q.adults,
    children: q.children,
  };
  const affiliateId = process.env.BOOKING_AFFILIATE_ID?.trim() || null;

  // Hotel services expect the Latin city name, whatever language the page is in.
  const cityName =
    q.locale === "bg"
      ? await Promise.race([
          reversePlace(lat, lng, { lang: "en" }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3_000)),
        ])
          .then((latin) => weatherPlaceLabel(latin, null, "en"))
          .catch(() => null)
      : place;
  const city = (cityName ?? place).split(",")[0]?.trim() || place;
  // The links search by the Latin "Town, Country" name (Booking and Airbnb do not
  // find a Cyrillic village). A country alone would search the whole country.
  const linkQuery = {
    ...stayQuery,
    place: cityName?.includes(",") ? cityName : stayQuery.place,
  };
  let tripadvisorError: string | null = null;
  // Hotel prices for the same city, night and party are shared for a while, so
  // drivers on similar routes do not each spend a partner call.
  let partnerLive: RouteStackResult | null = null;
  const partnerLookup = async () => {
    if (!routeStackConfig()) return { value: null, source: "off" as const };
    return cachedValue<RouteStackResult>({
      key: `rs|${city.toLowerCase()}|${stayQuery.checkin}|${q.adults}|${q.children}`,
      kind: "routestack_hotels",
      ttlMs: minutesFromEnv(process.env.ROUTESTACK_CACHE_MINUTES, 60) * 60_000,
      persist: true,
      load: async () => {
        partnerLive = await searchHotels({
          city,
          checkIn: stayQuery.checkin,
          checkOut: stayQuery.checkout,
          adults: q.adults,
          children: q.children,
        });
        // A failed search is shown for debugging but never kept.
        return partnerLive?.ok ? partnerLive : null;
      },
    });
  };
  const [stays, partnerCached] = await Promise.all([
    tripadvisorKey()
      ? nearbyStays(
          { lat, lng },
          { onError: (message) => (tripadvisorError = message) }
        )
      : Promise.resolve(null),
    partnerLookup(),
  ]);
  const partner = partnerCached.value ?? (partnerLive as RouteStackResult | null);
  const available = [...(partner?.hotels ?? [])]
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        (a.price ?? Infinity) - (b.price ?? Infinity)
    )
    .slice(0, 4);
  const traveler = [
    q.children > 0 ? "children" : "",
    q.pet === "1" ? "pet" : "",
    q.adults > 1 ? `${q.adults} adults` : "",
  ].filter(Boolean);
  let aiError: string | null = null;
  const why =
    stays && stays.length > 0 && aiConfig()
      ? await stayWhy(
          { locale: q.locale, place, stays, traveler },
          { onError: (message) => (aiError = message) }
        )
      : null;

  return NextResponse.json(
    {
      place,
      links: {
        booking: bookingSearchUrl(linkQuery, affiliateId),
        airbnb: airbnbSearchUrl(linkQuery),
        booking_partner: Boolean(affiliateId),
      },
      tripadvisor: stays,
      tripadvisor_configured: Boolean(tripadvisorKey()),
      available_hotels: partner ? { ok: partner.ok, items: available } : null,
      // Key names and error texts only, to fix a changed response without exposing data.
      ...(q.debug === "1"
        ? {
            tripadvisor_error: tripadvisorError,
            ai_error: aiError,
            partner_shape: partner?.shape ?? null,
            partner_error: partner?.error ?? null,
            partner_city: city,
            partner_base: routeStackConfig()?.baseUrl ?? null,
            partner_cache: partnerCached.source,
          }
        : {}),
      why,
    },
    // Tripadvisor content must not be kept, not even in the browser cache.
    { headers: { "Cache-Control": "no-store" } }
  );
}
