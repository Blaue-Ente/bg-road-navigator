#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const { bg } = await import("../lib/i18n/locales/bg.ts");
const { bgRestUi } = await import("../lib/i18n/locales/bg-rest-ui.ts");
const { bgRestPlanner } = await import("../lib/i18n/locales/bg-rest-planner.ts");

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[p] = v;
    else if (v && typeof v === "object") Object.assign(out, flatten(v, p));
  }
  return out;
}

const all = flatten(bg);
const ui = new Set(Object.keys(flatten(bgRestUi)));
const pl = new Set(Object.keys(flatten(bgRestPlanner)));
const coreFlat = {};
for (const [k, v] of Object.entries(all)) {
  if (!ui.has(k) && !pl.has(k)) coreFlat[k] = v;
}

fs.mkdirSync(path.join(ROOT, "lib/i18n/locales/translations"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "lib/i18n/locales/translations/bg-core.flat.json"),
  JSON.stringify(coreFlat, null, 2),
  "utf8"
);
fs.writeFileSync(
  path.join(ROOT, "lib/i18n/locales/translations/bg-ui.flat.json"),
  JSON.stringify(flatten(bgRestUi), null, 2),
  "utf8"
);
fs.writeFileSync(
  path.join(ROOT, "lib/i18n/locales/translations/bg-planner.flat.json"),
  JSON.stringify(flatten(bgRestPlanner), null, 2),
  "utf8"
);
fs.writeFileSync(
  path.join(ROOT, "lib/i18n/locales/translations/bg-all.flat.json"),
  JSON.stringify(all, null, 2),
  "utf8"
);

const byValue = {};
for (const v of Object.values(all)) {
  if (!byValue[v]) byValue[v] = [];
  byValue[v].push(v);
}
fs.writeFileSync(
  path.join(ROOT, "lib/i18n/locales/translations/bg-unique.json"),
  JSON.stringify([...new Set(Object.values(all))].sort(), null, 2),
  "utf8"
);
console.log("exported", Object.keys(all).length, "paths,", Object.keys(byValue).length, "unique values");