#!/usr/bin/env node
/**
 * PR 25 captures — locale offer + layers panel stacking.
 * Run: npx --yes -p playwright@1.58.2 node scripts/pr25-capture.mjs
 * Requires `npm run build && npm start` on BASE_URL (default http://127.0.0.1:3000).
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const outDir = "/opt/cursor/artifacts/pr25-screenshots";

async function clearLocaleOffer(context) {
  await context.addInitScript(() => {
    try {
      localStorage.removeItem("bg-road-locale");
      localStorage.removeItem("bg-road-locale-offer");
    } catch {
      /* ignore */
    }
  });
}

async function shotLocaleOffer(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForSelector("[data-locale-offer='map']", { timeout: 30_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: false });
}

async function shotLayersOpen(page, name, width, height) {
  const viewport = { width, height };
  await page.setViewportSize(viewport);
  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.locator('[data-tap="layers-toggle"]').click();
  const panel =
    width <= 400
      ? '[data-tap="layers-panel-mobile"] [data-tap="layers-panel"]'
      : '[data-tap="layers-panel-desktop"] [data-tap="layers-panel"]';
  await page.waitForSelector(panel, { state: "visible", timeout: 15_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: false });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  const localeCtx = await browser.newContext({ locale: "en-US" });
  await clearLocaleOffer(localeCtx);
  let page = await localeCtx.newPage();
  await shotLocaleOffer(page, "locale-offer-mobile-390.png", {
    width: 390,
    height: 844,
  });
  await shotLocaleOffer(page, "locale-offer-desktop-1440.png", {
    width: 1440,
    height: 900,
  });
  await page.close();
  await localeCtx.close();

  const layersCtx = await browser.newContext({ locale: "bg-BG" });
  page = await layersCtx.newPage();
  await shotLayersOpen(page, "layers-open-mobile-390.png", 390, 844);
  await shotLayersOpen(page, "layers-open-mobile-360.png", 360, 740);
  await page.close();
  await layersCtx.close();

  await browser.close();
  console.log(`Wrote captures under ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});