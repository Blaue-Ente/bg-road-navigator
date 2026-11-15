import { constants } from "node:crypto";
import https from "node:https";
import { readOsmCache, writeOsmCache } from "@/lib/nakordoni/cache-store";
import { parseDatexSituations } from "@/lib/hazards/datex-parse";
import type { RoadHazard } from "@/lib/hazards/types";

/** One successful read serves every caller for 15 minutes. */
export const DATEX_TTL_MS = 15 * 60 * 1000;

export const DATEX_CACHE_KEY = "datex:bg-hazards";

export const DATEX_INDEX_URL = "https://datasheet.api.bg/";

export const DATEX_FILES_BASE = "https://datasheet.api.bg/files";

export const DATEX_USER_AGENT =
  "BG-Road-Navigator/1.0 (+https://github.com/Blaue-Ente/bg-road-navigator)";

/**
 * The National Access Point still speaks TLS 1.0. Node 20+ refuses that
 * handshake unless legacy renegotiation is allowed. Certificates stay checked.
 */
const legacyAgent = new https.Agent({
  secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT ?? 0x4,
  minVersion: "TLSv1",
  rejectUnauthorized: true,
});

const FEED_CODES = ["r03", "r01", "r02", "d02", "d01", "o05", "w05"] as const;

const FEED_SLUG: Record<(typeof FEED_CODES)[number], string> = {
  r03: "roadworks_r03",
  r01: "closed_roads_r01",
  r02: "closed_roadways_r02",
  d02: "danger_on_roadway_d02",
  d01: "accidents_d01",
  o05: "bad_road_conditions_o05",
  w05: "weather_w05",
};

export interface DatexSnapshot {
  fetchedAt: string;
  situations: RoadHazard[];
}

export interface DatexResponse {
  status: number;
  body: string;
}

export type DatexTransport = (url: string) => Promise<DatexResponse | null>;

const memory: { lastAttemptAt: number; lastGood: DatexSnapshot | null } = {
  lastAttemptAt: 0,
  lastGood: null,
};

let transport: DatexTransport = httpsDatexGet;

export function setDatexTransportForTests(next: DatexTransport | null) {
  transport = next ?? httpsDatexGet;
}

export function resetDatexForTests() {
  memory.lastAttemptAt = 0;
  memory.lastGood = null;
  transport = httpsDatexGet;
}

/** Newest file per feed code. The date in the filename changes through the day. */
export function discoverDatexFiles(html: string): string[] {
  const best = new Map<string, { date: string; file: string }>();
  const re = /(\d{8})_([a-z0-9_]+)_([a-z]\d{2})\.xml/gi;
  for (const match of html.matchAll(re)) {
    const date = match[1]!;
    const slug = match[2]!.toLowerCase();
    const code = match[3]!.toLowerCase();
    if (!(FEED_CODES as readonly string[]).includes(code)) continue;
    const prev = best.get(code);
    if (prev && prev.date >= date) continue;
    best.set(code, { date, file: `${date}_${slug}_${code}.xml` });
  }
  return FEED_CODES.flatMap((code) => {
    const row = best.get(code);
    return row ? [`${DATEX_FILES_BASE}/${row.file}`] : [];
  });
}

export function sofiaDateStamp(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts.replaceAll("-", "");
}

export function fallbackDatexUrls(now: Date): string[] {
  const stamp = sofiaDateStamp(now);
  return FEED_CODES.map(
    (code) => `${DATEX_FILES_BASE}/${stamp}_${FEED_SLUG[code]}.xml`
  );
}

export async function loadRoadHazards(now = Date.now()): Promise<RoadHazard[]> {
  const snapshot = await loadDatexSnapshot(now);
  return snapshot?.situations ?? [];
}

/**
 * Cached situations for the whole country. A failed read keeps the previous
 * good snapshot and does not try again until the 15-minute gap has passed.
 */
export async function loadDatexSnapshot(
  now = Date.now()
): Promise<DatexSnapshot | null> {
  const cached = await readOsmCache(DATEX_CACHE_KEY, now);
  if (isSnapshot(cached)) {
    memory.lastGood = cached;
    return cached;
  }
  if (now - memory.lastAttemptAt < DATEX_TTL_MS) return memory.lastGood;
  memory.lastAttemptAt = now;
  try {
    const bodies = await fetchBodies(now);
    if (bodies.length === 0) return memory.lastGood;
    const snapshot: DatexSnapshot = {
      fetchedAt: new Date(now).toISOString(),
      situations: parseBodies(bodies, now),
    };
    memory.lastGood = snapshot;
    await writeOsmCache({
      key: DATEX_CACHE_KEY,
      kind: "datex",
      payload: snapshot,
      ttlMs: DATEX_TTL_MS,
      now: new Date(now),
    });
    return snapshot;
  } catch {
    return memory.lastGood;
  }
}

async function fetchBodies(now: number): Promise<string[]> {
  const index = await transport(DATEX_INDEX_URL);
  const discovered =
    index && index.status >= 200 && index.status < 300
      ? discoverDatexFiles(index.body)
      : [];
  if (discovered.length > 0) {
    const responses = await Promise.all(
      discovered.map((url) => transport(url))
    );
    return responses.flatMap((response) => {
      const body = xmlBody(response);
      return body ? [body] : [];
    });
  }
  const today = fallbackDatexUrls(new Date(now));
  const todayResponses = await Promise.all(today.map((url) => transport(url)));
  const bodies: string[] = [];
  const missing: string[] = [];
  today.forEach((url, index) => {
    const response = todayResponses[index];
    const body = xmlBody(response);
    if (body) bodies.push(body);
    else if (response?.status === 404) missing.push(url);
  });
  if (missing.length === 0) return bodies;
  const yesterdayStamp = sofiaDateStamp(new Date(now - 86_400_000));
  const yesterday = missing.map((url) =>
    url.replace(/\/\d{8}_/, `/${yesterdayStamp}_`)
  );
  const yesterdayResponses = await Promise.all(
    yesterday.map((url) => transport(url))
  );
  for (const response of yesterdayResponses) {
    const body = xmlBody(response);
    if (body) bodies.push(body);
  }
  return bodies;
}

function parseBodies(bodies: string[], now: number): RoadHazard[] {
  const seen = new Set<string>();
  const rows: RoadHazard[] = [];
  const at = new Date(now);
  for (const body of bodies) {
    for (const hazard of parseDatexSituations(body, { now: at })) {
      if (seen.has(hazard.id)) continue;
      seen.add(hazard.id);
      rows.push(hazard);
    }
  }
  return rows;
}

function xmlBody(response: DatexResponse | null | undefined): string | null {
  if (!response || response.status !== 200) return null;
  if (!response.body.includes("payloadPublication")) return null;
  return response.body;
}

function isSnapshot(value: unknown): value is DatexSnapshot {
  if (!value || typeof value !== "object") return false;
  const row = value as DatexSnapshot;
  return typeof row.fetchedAt === "string" && Array.isArray(row.situations);
}

function httpsDatexGet(url: string): Promise<DatexResponse | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: DatexResponse | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const req = https.get(
      url,
      {
        agent: legacyAgent,
        headers: {
          Accept: "application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
          "User-Agent": DATEX_USER_AGENT,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 8_000_000) {
            req.destroy();
            finish(null);
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          finish({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.setTimeout(8_000, () => {
      req.destroy();
      finish(null);
    });
    req.on("error", () => finish(null));
  });
}
