/**
 * Photon 1.3 forward and reverse geocoding.
 * Results are mapped onto the same RoutePoint shape Nominatim already returns.
 * Location bias plus a light re-rank keep major cities ahead of same-name villages.
 * A query that includes a house number promotes the feature whose street and
 * housenumber match it, ahead of Photon's own order.
 */

import { catalog, type Locale } from "@/lib/i18n/locale";
import {
  failureFromError,
  failureFromStatus,
  ociFetch,
  PHOTON_COLD_TIMEOUT_MS,
  PHOTON_TIMEOUT_MS,
  type OciGeoConfig,
  type UpstreamFailure,
} from "@/lib/api-clients/oci-geo";
import { bestStreetTier, foldStreetName } from "@/lib/geo/street-match";
import type { RoutePoint } from "@/types/route.types";

const EUROPE_BOUNDS = {
  minLat: 34,
  maxLat: 72,
  minLng: -25,
  maxLng: 45,
};
const RESULT_LIMIT = 7;
const CANDIDATE_LIMIT = 30;
const STRUCTURED_LIMIT = 5;
const STRUCTURED_TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
/** This isolate treats Photon as cold again after eight quiet minutes. */
const PHOTON_COLD_AFTER_MS = 8 * 60 * 1000;
const PHOTON_LANGS = new Set(["de", "bg", "el", "en", "ro", "tr", "sr"]);
const DEFAULT_BIAS = { lat: 42.6977, lon: 23.3219, zoom: 7 };

const MAJOR_PLACE: Record<string, number> = {
  city: 14,
  town: 8,
  municipality: 5,
};
const MINOR_PLACE = new Set([
  "village",
  "hamlet",
  "suburb",
  "neighbourhood",
  "neighborhood",
  "isolated_dwelling",
  "farm",
  "allotments",
  "quarter",
]);

const CITY_LIKE_PLACE = new Set([
  "city",
  "town",
  "municipality",
  "locality",
  "county",
  "state",
  "region",
]);

const STREET_LIKE = new Set([
  "street",
  "house",
  "primary",
  "secondary",
  "residential",
  "trunk",
  "tertiary",
  "road",
  "path",
  "footway",
]);
const STATION_TOKENS = new Set([
  "hauptbahnhof",
  "bahnhof",
  "hbf",
  "station",
  "gare",
  "gara",
  "вокзал",
  "гара",
]);
const STREET_PREFIX =
  /^(?:булевард|бул|улица|ул|ulitsa|ulica|ul|boulevard|bulevard|blvd|bul|площад|пл|piazza|platz|via)\.?\s+/iu;

export interface PhotonProperties {
  osm_id?: number;
  osm_type?: string;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  name?: string;
  country?: string;
  countrycode?: string;
  state?: string;
  county?: string;
  city?: string;
  district?: string;
  locality?: string;
  street?: string;
  housenumber?: string;
  extent?: number[];
  importance?: number;
}

export interface PhotonFeature {
  type?: string;
  geometry?: { type?: string; coordinates?: number[] };
  properties?: PhotonProperties;
}

export interface GeocodeContext {
  lat?: number;
  lon?: number;
  zoom?: number;
  lang?: string;
}

export interface ParsedAddressQuery {
  housenumber: string;
  street: string;
  city?: string;
}

interface GeocodeBias {
  lat: number;
  lon: number;
  zoom: number;
}

const resultCache = new Map<
  string,
  { expiresAt: number; places: RoutePoint[] }
>();
let lastPhotonSuccessAt = 0;

export function clearPhotonCacheForTests() {
  resultCache.clear();
  lastPhotonSuccessAt = 0;
}

/** 7s once this process has heard from Photon recently; 12s after a cold gap. */
export function photonRequestTimeout(now = Date.now()): number {
  if (
    lastPhotonSuccessAt === 0 ||
    now - lastPhotonSuccessAt >= PHOTON_COLD_AFTER_MS
  ) {
    return PHOTON_COLD_TIMEOUT_MS;
  }
  return PHOTON_TIMEOUT_MS;
}

export function notePhotonSuccess(now = Date.now()) {
  lastPhotonSuccessAt = now;
}

/**
 * House number from "Street 1" or "1 Street", with or without a city after a comma.
 * Street prefixes (бул., ул., ulitsa) are ignored. City-only text returns null.
 */
export function parseAddressQuery(query: string): ParsedAddressQuery | null {
  const trimmed = query.trim();
  if (!trimmed || !/\d/u.test(trimmed)) return null;
  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  let streetPart: string | undefined;
  let extracted: { housenumber: string; street: string } | null = null;
  for (const part of parts) {
    const candidate = extractStreetAndNumber(part);
    if (candidate) {
      streetPart = part;
      extracted = candidate;
      break;
    }
  }
  if (!extracted || !streetPart) return null;
  const city = parts.find((part) => part !== streetPart);
  return city ? { ...extracted, city } : extracted;
}

export function photonLanguage(lang: string | undefined): string {
  const code = (lang ?? "bg").trim().toLowerCase().slice(0, 2);
  return PHOTON_LANGS.has(code) ? code : "bg";
}

/** Map zoom sets the bias radius. The scale keeps prominent places in the list. */
export function locationBiasScale(zoom: number): number {
  if (zoom >= 12) return 0.35;
  if (zoom >= 6) return 0.55;
  return 0.7;
}

export function resolveGeocodeBias(context?: GeocodeContext): GeocodeBias {
  const lat = inRange(context?.lat, -90, 90);
  const lon = inRange(context?.lon, -180, 180);
  const zoom = Math.round(
    Math.min(18, Math.max(1, context?.zoom ?? DEFAULT_BIAS.zoom))
  );
  if (lat == null || lon == null) {
    return { ...DEFAULT_BIAS, zoom };
  }
  return { lat, lon, zoom };
}

export function mapPhotonCollection(
  payload: unknown,
  query: string
): RoutePoint[] {
  return rankPhotonFeatures(readFeatures(payload), query)
    .map((feature) => photonFeatureToPlace(feature))
    .filter((place): place is RoutePoint => place != null)
    .slice(0, RESULT_LIMIT);
}

export function rankPhotonFeatures(
  features: PhotonFeature[],
  query: string
): PhotonFeature[] {
  const shortCity = isShortCityQuery(query);
  const stationQuery = mentionsStation(query);
  const address = parseAddressQuery(query);
  return features
    .map((feature, index) => ({
      feature,
      index,
      score: scoreFeature(feature, query, index, features.length, {
        shortCity,
        stationQuery,
        address,
      }),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.feature);
}

export function photonFeatureToPlace(
  feature: PhotonFeature,
  locale: Locale = "bg"
): RoutePoint | null {
  const coordinates = feature.geometry?.coordinates;
  const lng = coordinates?.[0];
  const lat = coordinates?.[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  if (!isInEurope(lat, lng)) return null;

  const props = feature.properties ?? {};
  const street = [props.street, props.housenumber].filter(Boolean).join(" ");
  const locality =
    props.city ||
    props.locality ||
    props.district ||
    props.county ||
    props.state;
  const label =
    street || props.name || locality || catalog(locale).poi.defaultPlace;
  const subtitle = [
    locality && locality !== label ? locality : null,
    props.state && props.state !== locality && props.state !== label
      ? props.state
      : null,
    props.country,
  ]
    .filter(Boolean)
    .join(", ");
  const osmType = props.osm_type || "N";
  const osmId = props.osm_id ?? `${lng.toFixed(5)},${lat.toFixed(5)}`;

  return {
    id: `geocode:${osmType}:${osmId}`,
    label,
    subtitle: subtitle || undefined,
    coords: { lng, lat },
    source: "geocoder",
    countryCode: props.countrycode?.toUpperCase(),
  };
}

export async function searchPhoton(
  query: string,
  context: GeocodeContext | undefined,
  config: OciGeoConfig
): Promise<
  { ok: true; places: RoutePoint[] } | { ok: false; outcome: UpstreamFailure }
> {
  const trimmed = query.trim();
  const bias = resolveGeocodeBias(context);
  const lang = photonLanguage(context?.lang);
  const cacheKey = [
    lang,
    bias.lat.toFixed(2),
    bias.lon.toFixed(2),
    bias.zoom,
    trimmed.toLocaleLowerCase("bg-BG"),
  ].join("|");
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, places: cached.places };
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: String(CANDIDATE_LIMIT),
    lang,
    lat: bias.lat.toFixed(5),
    lon: bias.lon.toFixed(5),
    zoom: String(bias.zoom),
    location_bias_scale: String(locationBiasScale(bias.zoom)),
  });

  const free = await fetchPhotonFeatures(
    `${config.baseUrl}/photon/api?${params}`,
    config,
    photonRequestTimeout()
  );
  if (!free.ok) return free;

  let features = free.features;
  const address = parseAddressQuery(trimmed);
  if (address && !features.some((feature) => exactAddress(feature, address))) {
    const structured = await fetchPhotonFeatures(
      `${config.baseUrl}/photon/structured?${structuredSearchParams(address, bias, lang)}`,
      config,
      STRUCTURED_TIMEOUT_MS
    );
    if (structured.ok) {
      features = dedupeFeatures([...structured.features, ...features]);
    }
  }

  const places = rankPhotonFeatures(features, trimmed)
    .map((feature) => photonFeatureToPlace(feature))
    .filter((place): place is RoutePoint => place != null)
    .slice(0, RESULT_LIMIT);
  remember(cacheKey, places);
  return { ok: true, places };
}

export async function reversePhoton(
  lat: number,
  lng: number,
  context: { lang?: string } | undefined,
  config: OciGeoConfig
): Promise<
  | { ok: true; place: RoutePoint | null }
  | { ok: false; outcome: UpstreamFailure }
> {
  if (!isInEurope(lat, lng)) return { ok: true, place: null };
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    lang: photonLanguage(context?.lang),
    limit: "1",
  });
  const response = await fetchPhotonFeatures(
    `${config.baseUrl}/photon/reverse?${params}`,
    config,
    photonRequestTimeout()
  );
  if (!response.ok) return response;
  const place =
    rankPhotonFeatures(response.features, "")
      .map((feature) => photonFeatureToPlace(feature))
      .find((item): item is RoutePoint => item != null) ?? null;
  return { ok: true, place };
}

function remember(key: string, places: RoutePoint[]) {
  resultCache.set(key, { places, expiresAt: Date.now() + CACHE_TTL_MS });
  if (resultCache.size <= 250) return;
  const oldest = resultCache.keys().next().value;
  if (oldest) resultCache.delete(oldest);
}

function readFeatures(payload: unknown): PhotonFeature[] {
  if (!payload || typeof payload !== "object") return [];
  const features = (payload as { features?: unknown }).features;
  if (!Array.isArray(features)) return [];
  return features.filter(
    (feature): feature is PhotonFeature =>
      Boolean(feature) && typeof feature === "object"
  );
}

async function fetchPhotonFeatures(
  url: string,
  config: OciGeoConfig,
  timeoutMs: number
): Promise<
  | { ok: true; features: PhotonFeature[] }
  | { ok: false; outcome: UpstreamFailure }
> {
  try {
    const response = await ociFetch(
      url,
      config.apiKey,
      { method: "GET", next: { revalidate: 0 } },
      timeoutMs
    );
    if (!response.ok || response.status >= 300) {
      return { ok: false, outcome: failureFromStatus(response.status) };
    }
    const features = readFeatures(await response.json());
    notePhotonSuccess();
    return { ok: true, features };
  } catch (error) {
    return { ok: false, outcome: failureFromError(error) };
  }
}

function structuredSearchParams(
  address: ParsedAddressQuery,
  bias: GeocodeBias,
  lang: string
): URLSearchParams {
  const params = new URLSearchParams({
    street: address.street,
    housenumber: address.housenumber,
    limit: String(STRUCTURED_LIMIT),
    lang,
    lat: bias.lat.toFixed(5),
    lon: bias.lon.toFixed(5),
    zoom: String(bias.zoom),
    location_bias_scale: String(locationBiasScale(bias.zoom)),
  });
  if (address.city) params.set("city", address.city);
  return params;
}

function dedupeFeatures(features: PhotonFeature[]): PhotonFeature[] {
  const seen = new Set<string>();
  const unique: PhotonFeature[] = [];
  for (const feature of features) {
    const props = feature.properties ?? {};
    const key = [
      props.osm_type ?? "",
      props.osm_id ?? "",
      props.housenumber ?? "",
      props.street ?? "",
      props.name ?? "",
    ].join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(feature);
  }
  return unique;
}

function extractStreetAndNumber(
  raw: string
): { housenumber: string; street: string } | null {
  const rest = stripRawPrefixes(raw);
  const trailing = rest.match(/^(.+?)\s+(\d{1,4}[a-zа-я]?)$/iu);
  const leading = rest.match(/^(\d{1,4}[a-zа-я]?)\s+(.+)$/iu);
  let housenumber: string | undefined;
  let street: string | undefined;
  if (trailing?.[1] && trailing[2] && hasStreetWord(trailing[1])) {
    housenumber = trailing[2];
    street = trailing[1];
  } else if (leading?.[1] && leading[2] && hasStreetWord(leading[2])) {
    housenumber = leading[1];
    street = leading[2];
  }
  if (!housenumber || !street) return null;
  street = stripRawPrefixes(street);
  if (foldStreetName(street).length < 3) return null;
  return {
    housenumber: housenumber.toLocaleLowerCase("bg-BG"),
    street,
  };
}

function hasStreetWord(value: string): boolean {
  return /\p{L}{2,}/u.test(value);
}

function stripRawPrefixes(value: string): string {
  let rest = value.trim();
  for (let guard = 0; guard < 4; guard += 1) {
    const next = rest.replace(STREET_PREFIX, "").trim();
    if (next === rest) break;
    rest = next;
  }
  return rest;
}

function exactAddress(
  feature: PhotonFeature,
  address: ParsedAddressQuery
): boolean {
  const props = feature.properties ?? {};
  if (!streetsMatch(address.street, props)) return false;
  return housenumbersEqual(featureHouseNumber(props), address.housenumber);
}

function streetsMatch(wanted: string, props: PhotonProperties): boolean {
  return bestStreetTier(wanted, [props.street, props.name]) !== "none";
}

function featureHouseNumber(props: PhotonProperties): string | undefined {
  const direct = props.housenumber?.trim();
  if (direct) return direct.toLocaleLowerCase("bg-BG").replace(/\s+/g, "");
  const fromName = props.name?.match(/(?:^|\s)(\d{1,4}[a-zа-я]?)$/iu)?.[1];
  return fromName?.toLocaleLowerCase("bg-BG");
}

function housenumbersEqual(
  featureNumber: string | undefined,
  wanted: string
): boolean {
  if (!featureNumber) return false;
  return (
    featureNumber.replace(/\s+/g, "") ===
    wanted.trim().toLocaleLowerCase("bg-BG").replace(/\s+/g, "")
  );
}

const CORRIDOR_COUNTRY_CODES = new Set([
  "BG",
  "TR",
  "DE",
  "AT",
  "RO",
  "RS",
  "HU",
  "HR",
  "SI",
  "SK",
  "CZ",
  "GR",
  "MK",
  "CH",
  "NL",
  "BE",
  "FR",
  "IT",
  "ES",
  "GB",
]);

function isCorridorCountry(code: string): boolean {
  return CORRIDOR_COUNTRY_CODES.has(code);
}

function scoreFeature(
  feature: PhotonFeature,
  query: string,
  index: number,
  total: number,
  flags: {
    shortCity: boolean;
    stationQuery: boolean;
    address: ParsedAddressQuery | null;
  }
): number {
  const props = feature.properties ?? {};
  const value = (props.osm_value ?? props.type ?? "").toLowerCase();
  const key = (props.osm_key ?? "").toLowerCase();
  let score = (total - index) * 2;
  if (
    typeof props.importance === "number" &&
    Number.isFinite(props.importance)
  ) {
    score += props.importance * 8;
  }
  score += nameScore(props.name ?? "", query);
  if (flags.shortCity) {
    score += MAJOR_PLACE[value] ?? 0;
    if (MINOR_PLACE.has(value)) score -= 8;
    const cc = (props.countrycode ?? "").toUpperCase();
    if (
      nameScore(props.name ?? "", query) >= 6 &&
      isCorridorCountry(cc)
    ) {
      score += 40;
    }
    const area = extentAreaKm2(props.extent);
    if (area != null) score += Math.min(8, Math.log10(area + 1) * 3);
  }
  if (
    flags.stationQuery &&
    (value === "station" || value === "halt" || key === "railway")
  ) {
    score += 12;
  }
  if (flags.address) {
    const tier = bestStreetTier(flags.address.street, [
      props.street,
      props.name,
    ]);
    const house = housenumbersEqual(
      featureHouseNumber(props),
      flags.address.housenumber
    );
    if (tier !== "none" && house) score += 220;
    else if (tier !== "none") score += 100;
    else if (house) score += 18;
  } else if (flags.shortCity) {
    const match = nameScore(props.name ?? "", query);
    if (CITY_LIKE_PLACE.has(value) && match >= 4) score += 140;
    if (
      (key === "highway" || STREET_LIKE.has(value)) &&
      !CITY_LIKE_PLACE.has(value)
    ) {
      score -= 50;
    }
    if (value === "station" || key === "railway") score -= 24;
  }
  return score;
}

function nameScore(name: string, query: string): number {
  const normalizedName = normalize(name);
  const normalizedQuery = normalize(query);
  if (!normalizedName || !normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 6;
  if (normalizedQuery.length >= 4 && normalizedName.includes(normalizedQuery)) {
    return 4;
  }
  return 0;
}

function isShortCityQuery(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 2 || trimmed.length > 40) return false;
  if (/[,\d]/.test(trimmed)) return false;
  if (mentionsStation(trimmed)) return false;
  return trimmed.split(/\s+/).length <= 2;
}

function mentionsStation(query: string): boolean {
  return normalize(query)
    .split(/[\s,./-]+/)
    .some((token) => STATION_TOKENS.has(token));
}

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("bg-BG")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function extentAreaKm2(extent: number[] | undefined): number | null {
  if (!extent || extent.length < 4) return null;
  const [lon1, lat1, lon2, lat2] = extent;
  if (![lon1, lat1, lon2, lat2].every((value) => typeof value === "number")) {
    return null;
  }
  const midLat = (((lat1 ?? 0) + (lat2 ?? 0)) / 2) * (Math.PI / 180);
  const widthKm =
    Math.abs((lon2 ?? 0) - (lon1 ?? 0)) * 111.32 * Math.cos(midLat);
  const heightKm = Math.abs((lat2 ?? 0) - (lat1 ?? 0)) * 110.57;
  const area = widthKm * heightKm;
  return area > 0 ? area : null;
}

function isInEurope(lat: number, lng: number): boolean {
  return (
    lat >= EUROPE_BOUNDS.minLat &&
    lat <= EUROPE_BOUNDS.maxLat &&
    lng >= EUROPE_BOUNDS.minLng &&
    lng <= EUROPE_BOUNDS.maxLng
  );
}

function inRange(
  value: number | undefined,
  min: number,
  max: number
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}
