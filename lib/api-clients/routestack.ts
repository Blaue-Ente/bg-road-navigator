import { createHmac, randomUUID } from "node:crypto";

/**
 * RouteStack partner API (hotel search). Auth is a short-lived partner token
 * obtained with an HMAC of "apiKey:timestamp:nonce"; every call then carries it
 * as a Bearer token. Keys are server-side only.
 */
const DEFAULT_BASE = "https://mcp.routestack.ai";
const TIMEOUT_MS = 12_000;
/** Ask for a new token this long before the old one runs out. */
const REFRESH_MARGIN_S = 300;

export interface RouteStackConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
}

export function routeStackConfig(
  env: NodeJS.ProcessEnv = process.env
): RouteStackConfig | null {
  const apiKey = env.ROUTESTACK_API_KEY?.trim();
  const apiSecret = env.ROUTESTACK_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;
  return {
    baseUrl: (env.ROUTESTACK_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/+$/, ""),
    apiKey,
    apiSecret,
  };
}

export function signPartnerRequest(
  config: Pick<RouteStackConfig, "apiKey" | "apiSecret">,
  timestamp: number,
  nonce: string
): string {
  return createHmac("sha256", config.apiSecret)
    .update(`${config.apiKey}:${timestamp}:${nonce}`)
    .digest("base64url");
}

/** Seconds since epoch when the JWT stops working; null if it is not readable. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")
    ) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

let cached: { token: string; refreshAtMs: number; key: string } | null = null;

export async function partnerToken(
  config: RouteStackConfig,
  fetchImpl: typeof fetch = fetch,
  nowMs = Date.now()
): Promise<string | null> {
  if (cached && cached.key === config.apiKey && cached.refreshAtMs > nowMs) {
    return cached.token;
  }
  const timestamp = Math.floor(nowMs / 1000);
  const nonce = randomUUID();
  try {
    const response = await fetchImpl(`${config.baseUrl}/mcp/auth/partner-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: config.apiKey,
        hmac: signPartnerRequest(config, timestamp, nonce),
        timestamp,
        nonce,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const { token } = (await response.json()) as { token?: string };
    if (!token) return null;
    const exp = tokenExpiry(token);
    cached = {
      token,
      key: config.apiKey,
      refreshAtMs: exp ? (exp - REFRESH_MARGIN_S) * 1000 : nowMs + 4 * 60_000,
    };
    return token;
  } catch {
    return null;
  }
}

export function clearRouteStackTokenForTests() {
  cached = null;
}

export interface RouteStackHotel {
  id: string;
  name: string;
  rating: number | null;
  /** Per night when the response says so, otherwise the lowest price given. */
  price: number | null;
  currency: string | null;
  image: string | null;
  url: string | null;
  address: string | null;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function pick(row: Json, keys: string[]): unknown {
  for (const key of keys) if (row[key] != null && row[key] !== "") return row[key];
  return undefined;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** First array of objects found in a response, wherever the service put it. */
export function findHotelList(payload: unknown, depth = 0): Json[] | null {
  if (Array.isArray(payload)) {
    return payload.length > 0 && payload.every(isObject) ? (payload as Json[]) : null;
  }
  if (!isObject(payload) || depth > 3) return null;
  for (const key of ["hotels", "results", "data", "items", "result", "properties"]) {
    const found = findHotelList(payload[key], depth + 1);
    if (found) return found;
  }
  for (const value of Object.values(payload)) {
    const found = findHotelList(value, depth + 1);
    if (found) return found;
  }
  return null;
}

export function toHotel(row: Json, index: number): RouteStackHotel | null {
  const name = asString(pick(row, ["name", "hotelName", "title", "propertyName"]));
  if (!name) return null;
  const rawPrice = pick(row, [
    "pricePerNight",
    "price",
    "minPrice",
    "lowestPrice",
    "startingPrice",
    "totalPrice",
    "rate",
  ]);
  let price = asNumber(rawPrice);
  let currency = asString(pick(row, ["currency", "currencyCode"]));
  if (isObject(rawPrice)) {
    price = asNumber(pick(rawPrice, ["amount", "value", "total", "perNight"]));
    currency = asString(pick(rawPrice, ["currency", "currencyCode"])) ?? currency;
  }
  const rawImage = pick(row, ["image", "imageUrl", "thumbnail", "photo", "images"]);
  const image = Array.isArray(rawImage)
    ? asString(isObject(rawImage[0]) ? pick(rawImage[0], ["url", "src"]) : rawImage[0])
    : asString(rawImage);
  const address = pick(row, ["address", "location"]);
  return {
    id: asString(pick(row, ["id", "hotelId", "code"])) ?? `rs-${index}`,
    name,
    rating: asNumber(pick(row, ["rating", "starRating", "stars", "reviewScore", "score"])),
    price,
    currency,
    image,
    url: asString(pick(row, ["url", "bookingUrl", "deepLink", "deeplink", "link", "bookUrl"])),
    address: isObject(address)
      ? asString(pick(address, ["full", "line1", "street", "city"]))
      : asString(address),
  };
}

export function parseHotels(payload: unknown): RouteStackHotel[] {
  const list = findHotelList(payload);
  if (!list) return [];
  return list
    .map(toHotel)
    .filter((hotel): hotel is RouteStackHotel => hotel !== null);
}

/** Key names only, so a changed response shape can be fixed without exposing data. */
export function describeShape(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return { array: payload.length, first: payload[0] ? describeShape(payload[0]) : null };
  }
  if (isObject(payload)) {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        isObject(value) || Array.isArray(value) ? describeShape(value) : typeof value,
      ])
    );
  }
  return typeof payload;
}

export interface RouteStackResult {
  hotels: RouteStackHotel[];
  ok: boolean;
  shape?: unknown;
}

export async function searchHotels(
  query: { city: string; checkIn: string; checkOut: string; adults?: number; children?: number },
  deps: { config?: RouteStackConfig | null; fetchImpl?: typeof fetch } = {}
): Promise<RouteStackResult | null> {
  const config = deps.config === undefined ? routeStackConfig() : deps.config;
  if (!config) return null;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const token = await partnerToken(config, fetchImpl);
  if (!token) return { hotels: [], ok: false };
  try {
    const response = await fetchImpl(`${config.baseUrl}/mcp/hotel/search-hotels`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        city: query.city,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        ...(query.adults ? { adults: query.adults } : {}),
        ...(query.children ? { children: query.children } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401) cached = null;
    if (!response.ok) return { hotels: [], ok: false };
    const payload = (await response.json()) as unknown;
    return { hotels: parseHotels(payload), ok: true, shape: describeShape(payload) };
  } catch {
    return { hotels: [], ok: false };
  }
}
