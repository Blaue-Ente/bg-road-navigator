export interface StayQuery {
  /** Town or area name for the search box. */
  place: string;
  lat: number;
  lng: number;
  /** YYYY-MM-DD */
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
}

export function isoDay(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function nextDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return isoDay(date);
}

/**
 * Booking.com search link. With an affiliate id it is a partner link and must
 * be labelled as one; without it, it is a plain search link.
 */
export function bookingSearchUrl(query: StayQuery, affiliateId?: string | null): string {
  const params = new URLSearchParams({
    ss: query.place,
    latitude: query.lat.toFixed(5),
    longitude: query.lng.toFixed(5),
    checkin: query.checkin,
    checkout: query.checkout,
    group_adults: String(Math.max(1, query.adults)),
    group_children: String(Math.max(0, query.children)),
    no_rooms: "1",
  });
  if (affiliateId?.trim()) params.set("aid", affiliateId.trim());
  return `https://www.booking.com/searchresults.html?${params}`;
}

export function airbnbSearchUrl(query: StayQuery): string {
  const params = new URLSearchParams({
    checkin: query.checkin,
    checkout: query.checkout,
    adults: String(Math.max(1, query.adults)),
    children: String(Math.max(0, query.children)),
  });
  return `https://www.airbnb.com/s/${encodeURIComponent(query.place)}/homes?${params}`;
}
