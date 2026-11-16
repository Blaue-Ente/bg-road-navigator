#!/usr/bin/env node
/**
 * PR 23 visual captures — run: npx --yes -p playwright@1.58.2 node scripts/pr23-capture.mjs
 * Requires `npm run build && npm start` on BASE_URL (default http://127.0.0.1:3000).
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const outDir = "/opt/cursor/artifacts/pr23-screenshots";

const SESSION_FIXTURE = JSON.stringify({
  v: 1,
  data: {
    tripPlan: null,
    activeRoute: {
      id: "fixture-berlin-sofia",
      origin: {
        id: "berlin",
        label: "Berlin",
        coords: { lng: 13.405, lat: 52.52 },
      },
      destination: {
        id: "sofia",
        label: "Sofia",
        coords: { lng: 23.3219, lat: 42.6977 },
      },
      waypoints: [],
      distance_km: 1200,
      duration_min: 720,
      geometry: {
        type: "LineString",
        coordinates: [
          [13.405, 52.52],
          [23.3219, 42.6977],
        ],
      },
      alternatives: [],
      routing_source: "osrm",
    },
    alternativeRoutes: [],
    planningVia: null,
    planDetailOpen: false,
  },
});

async function shot(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: `${outDir}/${name}`,
    fullPage: false,
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  const context = await browser.newContext({ locale: "bg-BG" });
  let page = await context.newPage();
  await shot(page, "home-mobile-390.png", { width: 390, height: 844 });
  await shot(page, "home-desktop-1440.png", { width: 1440, height: 900 });
  await page.close();
  await context.close();

  const routed = await browser.newContext({ locale: "bg-BG" });
  page = await routed.newPage();
  await page.addInitScript((raw) => {
    window.sessionStorage.setItem("bg-road-trip-session", raw);
  }, SESSION_FIXTURE);
  await shot(page, "home-route-mobile-390.png", { width: 390, height: 844 });
  await shot(page, "home-route-desktop-1440.png", { width: 1440, height: 900 });
  await page.close();
  await routed.close();

  const legend = await browser.newContext({ locale: "bg-BG" });
  page = await legend.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1500);
  const summary = page.locator('[data-overlay-slot="legend"] summary');
  await summary.click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${outDir}/home-legend-open-mobile-390.png`,
    fullPage: false,
  });
  await page.close();
  await legend.close();

  for (const [name, path, w, h] of [
    ["route-desktop-1440.png", "/route", 1440, 900],
    ["borders-mobile-390.png", "/borders", 390, 844],
    ["borders-desktop-1440.png", "/borders", 1440, 900],
  ]) {
    const ctx = await browser.newContext({ locale: "bg-BG" });
    const p = await ctx.newPage();
    await p.setViewportSize({ width: w, height: h });
    await p.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 120_000 });
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `${outDir}/${name}`, fullPage: false });
    await ctx.close();
  }

  await browser.close();
  console.log(`Wrote captures under ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});