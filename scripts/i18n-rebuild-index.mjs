#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, "..");

async function loadBg() {
  const ts = await import(path.join(ROOT, "lib/i18n/locales/bg.ts"));
  return ts.bg;
}

function indexTree(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      if (!out[v]) out[v] = p;
    } else if (v && typeof v === "object") indexTree(v, p, out);
  }
}

const bg = await loadBg();
const index = {};
indexTree(bg, "", index);
fs.writeFileSync(
  path.join(ROOT, "scripts/i18n-string-index.json"),
  JSON.stringify(index, null, 2),
  "utf8"
);
console.log(`indexed ${Object.keys(index).length} strings`);