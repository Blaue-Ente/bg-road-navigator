#!/usr/bin/env node
/**
 * Build lib/i18n/locales/{en,tr,ro}.ts from flat translation maps (value -> locale).
 * Maps must cover every leaf string in bg; missing entries fail the build.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const { bg } = await import(pathToFileURL(path.join(ROOT, "lib/i18n/locales/bg.ts")));

const LOCALES = ["en", "tr", "ro"];

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[p] = v;
    else if (v && typeof v === "object") Object.assign(out, flatten(v, p));
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [path, value] of Object.entries(flat)) {
  const parts = path.split(".");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!node[key] || typeof node[key] !== "object") node[key] = {};
      node = node[key];
    }
    node[parts[parts.length - 1]] = value;
  }
  return root;
}

function localizeTree(template, dict, missing) {
  if (typeof template === "string") {
    if (dict[template] == null || dict[template] === "") {
      missing.push(template.slice(0, 80));
      return template;
    }
    return dict[template];
  }
  const out = {};
  for (const [k, v] of Object.entries(template)) {
    out[k] = localizeTree(v, dict, missing);
  }
  return out;
}

const bgFlat = flatten(bg);
const bgValues = new Set(Object.values(bgFlat));

for (const locale of LOCALES) {
  const mapPath = path.join(
    ROOT,
    `lib/i18n/locales/translations/${locale}-by-bg.json`
  );
  if (!fs.existsSync(mapPath)) {
    console.error("missing", mapPath);
    process.exit(1);
  }
  const dict = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const missing = [];
  const tree = localizeTree(bg, dict, missing);
  const missingValues = [...bgValues].filter(
    (v) => dict[v] == null || dict[v] === ""
  );
  if (missingValues.length > 0) {
    console.error(
      `${locale}: ${missingValues.length} untranslated values (first 5):`,
      missingValues.slice(0, 5)
    );
    process.exit(1);
  }
  const outPath = path.join(ROOT, `lib/i18n/locales/${locale}.generated.ts`);
  const body = `import type { Messages } from "./bg";
import type { DeepRecord } from "../deep-record";

export const ${locale} = ${JSON.stringify(tree, null, 2)} satisfies DeepRecord<Messages>;
`;
  fs.writeFileSync(outPath, body, "utf8");
  console.log("wrote", outPath);
}