/**
 * Page the official MVR accident layer and write a compact snapshot.
 *
 * mvr.bg sits behind Cloudflare, so plain curl is challenged. This script
 * opens the public dashboard once, then queries the MapServer the dashboard
 * map references. Run it when a newer extract is needed:
 *
 *   node scripts/hotspots/fetch-mvr.mjs
 *   node scripts/hotspots/fetch-mvr.mjs --resume
 *
 * Requires playwright-core and Chrome (CHROME_PATH overrides the binary).
 * Pages are 2,000 features, with a pause between them. Injury and fatal
 * rows are kept. Property-only rows are counted and left out.
 */
import { createReadStream, createWriteStream, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

const LAYER =
  "/map/rest/services/GISMVR_M_PUBLIC/GISMVR_RSP_RoadAccident/MapServer/0";
const OUT_DIR = "lib/hotspots/data/mvr";
const JSONL = `${OUT_DIR}/accidents.jsonl`;
const PAGE = 2000;
const PAUSE_MS = 2500;
const CHROME = process.env.CHROME_PATH ?? "/opt/google/chrome/chrome";
const resume = process.argv.includes("--resume");

let browser = null;
let page = null;

try {
  await openDashboard();
  const injuryWhere = "diedcount > 0 OR injuredcount > 0";
  const saved = resume ? readSavedStats() : null;
  const all = saved
    ? { count: saved.layer_count, from: saved.layer_from, to: saved.layer_to }
    : await stats("1=1");
  if (!resume) await page.waitForTimeout(PAUSE_MS);
  const injury = saved
    ? {
        count: saved.injury_or_fatal_count,
        from: saved.injury_or_fatal_from,
        to: saved.injury_or_fatal_to,
      }
    : await stats(injuryWhere);
  console.log(JSON.stringify({ all, injury, resume }));

  await mkdir(OUT_DIR, { recursive: true });
  let lastId = resume ? await lastObjectId() : 0;
  const sink = createWriteStream(JSONL, { flags: resume ? "a" : "w" });
  let kept = resume ? await countLines() : 0;
  let pages = 0;
  let datedFrom = null;
  let datedTo = null;
  for (;;) {
    const where = `(${injuryWhere}) AND objectid > ${lastId}`;
    const payload = await query({
      where,
      outFields: "objectid,crashdate,year,diedcount,injuredcount,latitude,longitude",
      returnGeometry: "true",
      outSR: "4326",
      f: "json",
      orderByFields: "objectid",
      resultRecordCount: String(PAGE),
    });
    const features = payload.features ?? [];
    pages += 1;
    const previous = lastId;
    if (features.length === 0) break;
    for (const feature of features) {
      const row = compact(feature);
      if (!row) continue;
      sink.write(`${JSON.stringify(row)}\n`);
      kept += 1;
      if (!datedFrom || row.date < datedFrom) datedFrom = row.date;
      if (!datedTo || row.date > datedTo) datedTo = row.date;
      if (row.objectid > lastId) lastId = row.objectid;
    }
    const tail = features[features.length - 1]?.attributes?.objectid ?? lastId;
    if (tail > lastId) lastId = tail;
    console.log(
      JSON.stringify({ page: pages, features: features.length, kept, lastId })
    );
    if (lastId <= previous) break;
    if (features.length < PAGE && payload.exceededTransferLimit !== true) break;
    await reopen();
  }
  await new Promise((resolve, reject) => {
    sink.end(() => resolve());
    sink.on("error", reject);
  });

  const manifest = {
    retrieved_on: new Date().toISOString().slice(0, 10),
    layer_url:
      "https://www.mvr.bg/map/rest/services/GISMVR_M_PUBLIC/GISMVR_RSP_RoadAccident/MapServer/0",
    query_url:
      "https://www.mvr.bg/map/rest/services/GISMVR_M_PUBLIC/GISMVR_RSP_RoadAccident/MapServer/0/query",
    web_map_item: "9423f152c40340f4b40e548b21a5ae23",
    dashboard_item: "0b7065b1f1d34d7d8ad530c51434a9f0",
    out_sr: 4326,
    page_size: PAGE,
    pause_ms: PAUSE_MS,
    layer_count: all.count,
    layer_from: all.from,
    layer_to: all.to,
    injury_or_fatal_count: injury.count,
    injury_or_fatal_from: injury.from,
    injury_or_fatal_to: injury.to,
    snapshot_rows: kept,
    snapshot_from: resume ? (await span()).from : datedFrom,
    snapshot_to: resume ? (await span()).to : datedTo,
    fields: [
      "objectid",
      "crashdate",
      "year",
      "diedcount",
      "injuredcount",
      "latitude",
      "longitude",
    ],
    attribution: "Данни: МВР — Интерактивна карта на ПТП (mvr.bg)",
    refresh: "node scripts/hotspots/fetch-mvr.mjs && npx vite-node --config vitest.config.ts scripts/hotspots/refresh-cherna.ts",
  };
  await writeFile(`${OUT_DIR}/fetch.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ done: true, kept, datedFrom, datedTo, pages }));
} finally {
  await browser.close();
}

async function stats(where) {
  const payload = await query({
    where,
    returnGeometry: "false",
    f: "json",
    outStatistics: JSON.stringify([
      {
        statisticType: "count",
        onStatisticField: "objectid",
        outStatisticFieldName: "n",
      },
      {
        statisticType: "min",
        onStatisticField: "crashdate",
        outStatisticFieldName: "min_date",
      },
      {
        statisticType: "max",
        onStatisticField: "crashdate",
        outStatisticFieldName: "max_date",
      },
    ]),
  });
  const row = payload.features?.[0]?.attributes ?? {};
  return {
    count: row.n ?? null,
    from: row.min_date ? sofiaDate(row.min_date) : null,
    to: row.max_date ? sofiaDate(row.max_date) : null,
  };
}

async function query(params) {
  const path = `${LAYER}/query?${new URLSearchParams(params).toString()}`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await page.evaluate(async (path) => {
      const response = await fetch(path, { credentials: "include" });
      const text = await response.text();
      return { status: response.status, text };
    }, path);
    if (result.status === 200 && result.text.startsWith("{")) {
      return JSON.parse(result.text);
    }
    console.log(`retry ${attempt} status ${result.status}`);
    await reopen();
  }
  throw new Error(`MVR query failed for ${params.where ?? "page"}`);
}

async function openDashboard() {
  browser = await launch();
  page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 BG-Road-Navigator/1.0",
  });
  await page.goto(
    "https://www.mvr.bg/map/apps/dashboards/0b7065b1f1d34d7d8ad530c51434a9f0",
    { waitUntil: "commit", timeout: 90000 }
  );
  for (let i = 0; i < 20; i += 1) {
    const title = await page.title().catch(() => "");
    if (title && !/just a moment/i.test(title)) break;
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(1200);
}

async function reopen() {
  await browser?.close().catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  await openDashboard();
}

function readSavedStats() {
  return JSON.parse(readFileSync(`${OUT_DIR}/fetch.json`, "utf8"));
}

async function lastObjectId() {
  let last = 0;
  const input = createReadStream(JSONL);
  const lines = createInterface({ input });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (row.objectid > last) last = row.objectid;
  }
  return last;
}

async function span() {
  let from = null;
  let to = null;
  const input = createReadStream(JSONL);
  const lines = createInterface({ input });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (!from || row.date < from) from = row.date;
    if (!to || row.date > to) to = row.date;
  }
  return { from, to };
}

async function countLines() {
  let count = 0;
  const input = createReadStream(JSONL);
  const lines = createInterface({ input });
  for await (const line of lines) {
    if (line.trim()) count += 1;
  }
  return count;
}

function compact(feature) {
  const attributes = feature.attributes ?? {};
  const geometry = feature.geometry ?? {};
  const lng = numberOr(geometry.x, attributes.longitude);
  const lat = numberOr(geometry.y, attributes.latitude);
  if (lng == null || lat == null) return null;
  if (lat < 40 || lat > 47 || lng < 21 || lng > 30) return null;
  const died = Number(attributes.diedcount ?? 0);
  const injured = Number(attributes.injuredcount ?? 0);
  if (!(died > 0 || injured > 0)) return null;
  const crashMs = Number(attributes.crashdate);
  if (!Number.isFinite(crashMs)) return null;
  return {
    objectid: attributes.objectid,
    date: sofiaDate(crashMs),
    year: Number(attributes.year) || Number(sofiaDate(crashMs).slice(0, 4)),
    lng: Math.round(lng * 1e6) / 1e6,
    lat: Math.round(lat * 1e6) / 1e6,
    died,
    injured,
  };
}

function numberOr(primary, fallback) {
  if (typeof primary === "number" && Number.isFinite(primary)) return primary;
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  return null;
}

function sofiaDate(ms) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

async function launch() {
  let playwright;
  try {
    playwright = await import("playwright-core");
  } catch {
    playwright = await import("/tmp/pw/node_modules/playwright-core/index.mjs");
  }
  return playwright.chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}
