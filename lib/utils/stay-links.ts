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
  /** Rooms to search for; defaults to one room for two adults. */
  rooms?: number;
  /** Ages of the children, which Booking.com asks for. */
  childAges?: number[];
  /** A pet travels: ask each platform for places that take animals. */
  pets?: boolean;
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
    no_rooms: String(Math.max(1, query.rooms ?? Math.ceil(query.adults / 2))),
    // Search around the point, so a village Booking does not know does not
    // turn into "the whole country".
    dest_type: "latlong",
  });
  for (const age of (query.childAges ?? []).slice(0, query.children)) {
    params.append("age", String(Math.min(17, Math.max(0, Math.round(age)))));
  }
  // Booking's "pets allowed" facility filter.
  if (query.pets) params.set("nflt", "hotelfacility=4");
  if (affiliateId?.trim()) params.set("aid", affiliateId.trim());
  return `https://www.booking.com/searchresults.html?${params}`;
}

export function airbnbSearchUrl(query: StayQuery): string {
  const params = new URLSearchParams({
    checkin: query.checkin,
    checkout: query.checkout,
    adults: String(Math.max(1, query.adults)),
    children: String(Math.max(0, query.children)),
    ...(query.pets ? { pets: "1" } : {}),
  });
  return `https://www.airbnb.com/s/${encodeURIComponent(query.place)}/homes?${params}`;
}


export function tripadvisorSearchUrl(query: StayQuery): string {
  const text = `${query.pets ? "pet friendly " : ""}hotels ${query.place}`;
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(text)}`;
}

export function googleMapsHotelsUrl(query: StayQuery): string {
  const text = `${query.pets ? "pet friendly " : ""}hotels near ${query.place}`;
  return `https://www.google.com/maps/search/${encodeURIComponent(text)}/@${query.lat.toFixed(5)},${query.lng.toFixed(5)},13z`;
}
