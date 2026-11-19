"use client";

import { useEffect, useState } from "react";
import { BedDouble, Building2, Home, MapPin, Star } from "lucide-react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { RouteStackHotel } from "@/lib/api-clients/routestack";
import type { TripadvisorStay } from "@/lib/api-clients/tripadvisor";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { PlanStop } from "@/lib/planner/types";
import { useRouteStore } from "@/lib/stores/route.store";
import {
  airbnbSearchUrl,
  bookingSearchUrl,
  googleMapsHotelsUrl,
  isoDay,
  nextDay,
  tripadvisorSearchUrl,
  type StayQuery,
} from "@/lib/utils/stay-links";

interface StaysPayload {
  place: string;
  links: {
    booking: string;
    airbnb: string;
    tripadvisor?: string;
    google_maps?: string;
    booking_partner: boolean;
  };
  tripadvisor: TripadvisorStay[] | null;
  tripadvisor_configured: boolean;
  available_hotels: { ok: boolean; items: RouteStackHotel[] } | null;
  why: string | null;
}

/** Where to sleep at an overnight stop: ratings, a short AI note, and booking links. */
export function StayOptions({
  stop,
  autoLoad = false,
}: {
  stop: PlanStop;
  /** Look up the places as soon as the card shows (the AI plan page). */
  autoLoad?: boolean;
}) {
  const m = useMessages();
  const locale = useLocale();
  const prefs = useRouteStore((state) => state.tripPlan?.preferences);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; data: StaysPayload }
    | { status: "failed" }
  >({ status: "idle" });

  const load = async () => {
    setState({ status: "loading" });
    const childAges = prefs?.with_children ? prefs.children_ages.slice(0, 6) : [];
    // A family with no ages given still has at least one child.
    const children = prefs?.with_children ? Math.max(1, childAges.length) : 0;
    const params = new URLSearchParams({
      lat: String(stop.coords.lat),
      lng: String(stop.coords.lng),
      checkin: isoDay(stop.eta),
      adults: String(Math.max(prefs?.adults ?? 1, prefs?.drivers ?? 1)),
      children: String(children),
      ...(childAges.length > 0 ? { ages: childAges.join(",") } : {}),
      locale,
      pet: prefs?.with_pet ? "1" : "0",
    });
    try {
      const response = await fetch(`/api/stays?${params}`);
      if (!response.ok) throw new Error("stays");
      setState({ status: "done", data: (await response.json()) as StaysPayload });
    } catch {
      setState({ status: "failed" });
    }
  };

  useEffect(() => {
    if (autoLoad && state.status === "idle") queueMicrotask(() => void load());
    // The lookup runs once per card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  if (autoLoad && state.status === "failed") {
    return <StayPlatforms stop={stop} prefs={prefs} data={null} offline />;
  }

  if (state.status !== "done") {
    return (
      <div className="plan-no-print mt-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={state.status === "loading"}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--waze-border)] px-4 text-sm font-semibold text-[var(--waze-accent-text)] disabled:opacity-50"
        >
          <BedDouble className="h-4 w-4" aria-hidden />
          {state.status === "loading" ? m.stay.loading : m.stay.find}
        </button>
        {state.status === "failed" && (
          <p className="mt-1 text-xs text-[var(--waze-danger)]">{m.stay.failed}</p>
        )}
      </div>
    );
  }

  const { data } = state;
  return (
    <div className="plan-no-print mt-2 space-y-2">
      <p className="text-sm font-medium text-[var(--waze-text)]">
        {formatTemplate(m.stay.near, { place: data.place })}
      </p>
      {data.available_hotels && data.available_hotels.items.length > 0 && (
        <div>
          <p className="text-sm font-medium text-[var(--waze-text)]">{m.stay.available}</p>
          <ul className="mt-1 space-y-1">
            {data.available_hotels.items.map((hotel) => (
              <li key={hotel.id} className="flex gap-3 text-sm text-[var(--waze-text)]">
                {hotel.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hotel.image}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0">
                {hotel.url ? (
                  <a
                    href={hotel.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="font-medium text-[var(--waze-accent-text)] underline"
                  >
                    {hotel.name}
                  </a>
                ) : (
                  <span className="font-medium">{hotel.name}</span>
                )}
                <span className="text-[var(--waze-text-secondary)]">
                  {hotel.rating != null ? ` · ${hotel.rating.toFixed(1)}★` : ""}
                  {hotel.price != null
                    ? ` · ${formatTemplate(m.stay.fromPrice, {
                        price: String(Math.round(hotel.price)),
                        currency: hotel.currency ?? "",
                      }).trim()}`
                    : ""}
                </span>
                {(hotel.free_cancellation || hotel.free_breakfast || hotel.pay_at_hotel) && (
                  <p className="text-xs text-[var(--waze-text-muted)]">
                    {[
                      hotel.free_cancellation ? m.stay.freeCancellation : null,
                      hotel.free_breakfast ? m.stay.breakfast : null,
                      hotel.pay_at_hotel ? m.stay.payAtHotel : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-[var(--waze-text-muted)]">{m.stay.availableNote}</p>
        </div>
      )}
      {data.tripadvisor && data.tripadvisor.length > 0 && (
        <div className="space-y-1">
          <ul className="space-y-1.5">
            {data.tripadvisor.map((stay) => (
              <li key={stay.id} className="text-sm text-[var(--waze-text)]">
                <a
                  href={stay.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--waze-accent-text)] underline"
                >
                  {stay.name}
                </a>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[var(--waze-text-secondary)]">
                  {stay.rating_icon_url ? (
                    // Tripadvisor's own bubble rating, as their brand rules ask.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stay.rating_icon_url}
                      alt={`${stay.rating?.toFixed(1) ?? ""} Tripadvisor`}
                      className="h-4"
                      loading="lazy"
                    />
                  ) : stay.rating != null ? (
                    <span>{stay.rating.toFixed(1)}★</span>
                  ) : null}
                  {stay.reviews != null && (
                    <a
                      href={stay.url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {formatTemplate(m.stay.reviews, { count: String(stay.reviews) })}
                    </a>
                  )}
                  {stay.distance_km != null && (
                    <span>
                      {formatTemplate(m.stay.distanceKm, {
                        km: stay.distance_km.toFixed(1),
                      })}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--waze-text-muted)]">{m.stay.tripadvisorCredit}</p>
        </div>
      )}
      {data.why && (
        <>
          <p className="text-sm leading-relaxed text-[var(--waze-text)]">{data.why}</p>
          <p className="text-xs text-[var(--waze-text-muted)]">{m.ai.disclaimer}</p>
        </>
      )}
      {!data.tripadvisor && data.tripadvisor_configured && (
        <p className="text-xs text-[var(--waze-text-muted)]">{m.stay.ratingsUnavailable}</p>
      )}
      <StayPlatforms stop={stop} prefs={prefs} data={data} />
      <p className="text-xs text-[var(--waze-text-muted)]">
        {data.links.booking_partner ? m.stay.partnerNote : m.stay.searchNote}
      </p>
    </div>
  );
}

type Prefs = NonNullable<ReturnType<typeof useRouteStore.getState>["tripPlan"]>["preferences"];

function fallbackLinks(stop: PlanStop, prefs: Prefs | undefined) {
  const childAges = prefs?.with_children ? prefs.children_ages.slice(0, 6) : [];
  const query: StayQuery = {
    place: stop.place_name ?? stop.title,
    lat: stop.coords.lat,
    lng: stop.coords.lng,
    checkin: isoDay(stop.eta),
    checkout: nextDay(isoDay(stop.eta)),
    adults: Math.max(prefs?.adults ?? 1, prefs?.drivers ?? 1),
    children: prefs?.with_children ? Math.max(1, childAges.length) : 0,
    childAges,
    pets: Boolean(prefs?.with_pet),
  };
  return {
    booking: bookingSearchUrl(query),
    airbnb: airbnbSearchUrl(query),
    tripadvisor: tripadvisorSearchUrl(query),
    google_maps: googleMapsHotelsUrl(query),
    booking_partner: false,
  };
}

/** One button per platform, with an icon; the search carries the dates, the party and a pet. */
function StayPlatforms({
  stop,
  prefs,
  data,
  offline = false,
}: {
  stop: PlanStop;
  prefs: Prefs | undefined;
  data: StaysPayload | null;
  offline?: boolean;
}) {
  const m = useMessages();
  const fallback = fallbackLinks(stop, prefs);
  const links = {
    booking: data?.links.booking ?? fallback.booking,
    airbnb: data?.links.airbnb ?? fallback.airbnb,
    tripadvisor: data?.links.tripadvisor ?? fallback.tripadvisor,
    google_maps: data?.links.google_maps ?? fallback.google_maps,
    partner: data?.links.booking_partner ?? false,
  };
  const items = [
    { name: "Booking.com", href: links.booking, Icon: Building2, partner: links.partner },
    { name: "Airbnb", href: links.airbnb, Icon: Home, partner: false },
    { name: "Tripadvisor", href: links.tripadvisor, Icon: Star, partner: false },
    { name: "Google Maps", href: links.google_maps, Icon: MapPin, partner: false },
  ];
  return (
    <div className="plan-no-print mt-2 space-y-2">
      {offline && (
        <p className="text-xs text-[var(--waze-text-muted)]">{m.aiPlan.offlineNote}</p>
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
        {m.aiPlan.platforms}
        {prefs?.with_pet ? ` · ${m.aiPlan.petBadge}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ name, href, Icon, partner }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel={`noopener noreferrer${partner ? " sponsored" : ""}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--waze-accent)] px-4 text-sm font-semibold text-white"
          >
            <Icon className="h-4 w-4" aria-hidden />
            {name}
          </a>
        ))}
      </div>
      {prefs?.with_pet && (
        <p className="text-xs text-[var(--waze-text-muted)]">{m.aiPlan.petNote}</p>
      )}
    </div>
  );
}
