#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const CYR = /[\u0400-\u04FF]/;
const ALLOWLIST = new Set([
  "components/location/TripProximity.test.tsx",
  "components/ui/CountryFlag.tsx",
]);

function nsFor(rel) {
  if (rel.startsWith("app/(app)/") && rel.endsWith("/page.tsx"))
    return `${rel.split("/")[2]}Page`;
  if (rel.startsWith("app/(auth)/")) return "authPage";
  if (rel.startsWith("app/")) return "app";
  const parts = rel.split("/");
  return parts[1] ?? "misc";
}

function keyFor(text) {
  return `k${crypto.createHash("sha1").update(text).digest("hex").slice(0, 8)}`;
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function loadIndex() {
  const p = path.join(ROOT, "scripts/i18n-string-index.json");
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function indexToRest(index) {
  const rest = {};
  for (const [text, dot] of Object.entries(index)) {
    const [ns, ...restKeys] = dot.split(".");
    const key = restKeys.join("_") || keyFor(text);
    rest[ns] ??= {};
    rest[ns][key] = text;
  }
  return rest;
}

function saveRest(rest) {
  const lines = [
    "/** Additional UI + planner copy (Bulgarian). Merged into `bg`. */",
    "export const bgRest = {",
  ];
  for (const [ns, bucket] of Object.entries(rest)) {
    const nsKey = /^[A-Za-z_][A-Za-z0-9_]*$/.test(ns)
      ? ns
      : JSON.stringify(ns);
    lines.push(`  ${nsKey}: {`);
    for (const [k, v] of Object.entries(bucket)) {
      const kKey = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : JSON.stringify(k);
      lines.push(`    ${kKey}: ${JSON.stringify(v)},`);
    }
    lines.push("  },");
  }
  lines.push("} as const;\n");
  fs.writeFileSync(
    path.join(ROOT, "lib/i18n/locales/bg-rest.ts"),
    lines.join("\n"),
    "utf8"
  );
}

function pathExpr(p) {
  return `m.${p}`;
}

const index = loadIndex();
const rest = indexToRest(index);

for (const base of ["app", "components"]) {
  const root = path.join(ROOT, base);
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;
    let text = fs.readFileSync(file, "utf8");
    if (!CYR.test(text)) continue;
    if (!text.includes('"use client"')) {
      text = `"use client";\n\nimport { useMessages } from "@/components/i18n/LocaleProvider";\n\n${text}`;
    } else if (!text.includes("useMessages")) {
      text = text.replace(
        '"use client";\n',
        '"use client";\n\nimport { useMessages } from "@/components/i18n/LocaleProvider";\n\n'
      );
    }
    const lines = text.split("\n");
    const fnStarts = [];
    lines.forEach((ln, i) => {
      if (
        /^(export default function|export function|function) \w+/.test(ln.trim())
      )
        fnStarts.push(i);
    });
    const inFn = (i) =>
      fnStarts.length === 0
        ? true
        : fnStarts.some(
            (s, idx) =>
              i >= s && (idx + 1 >= fnStarts.length ? true : i < fnStarts[idx + 1])
          );
    let dirty = false;
    for (let i = 0; i < lines.length; i++) {
      if (!inFn(i)) continue;
      let line = lines[i];
      if (!CYR.test(line) || line.trimStart().startsWith("//")) continue;
      if (line.includes("import ") && line.includes("LocaleProvider")) continue;
      const reps = [];
      for (const m of line.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g))
        if (CYR.test(m[1])) reps.push(m[1]);
      for (const m of line.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g))
        if (CYR.test(m[1])) reps.push(m[1]);
      for (const m of line.matchAll(/>\s*([^<>{]+?)\s*</g)) {
        const inner = m[1].trim();
        if (CYR.test(inner) && inner.length < 200) reps.push(inner);
      }
      for (const m of line.matchAll(/`([^`\\]*(?:\\.[^`\\]*)*)`/g))
        if (CYR.test(m[1]) && !m[1].includes("${")) reps.push(m[1]);
      const trimmed = line.trim();
      if (
        CYR.test(trimmed) &&
        !/[<>{`}]/.test(trimmed) &&
        trimmed.length < 220
      ) {
        reps.push(trimmed);
      }
      for (const src of [...new Set(reps)].sort((a, b) => b.length - a.length)) {
        const ns = nsFor(rel);
        let dot = index[src];
        if (!dot) {
          const key = keyFor(src);
          dot = `${ns}.${key}`;
          index[src] = dot;
          rest[ns] ??= {};
          rest[ns][key] = src;
        }
        const expr = pathExpr(dot);
        if (line.includes(`"${src}"`))
          line = line.split(`"${src}"`).join(`{${expr}}`);
        if (line.includes(`'${src}'`))
          line = line.split(`'${src}'`).join(`{${expr}}`);
        if (line.includes(`>${src}<`))
          line = line.replace(`>${src}<`, `>{${expr}}<`);
        if (line.includes(`\`${src}\``))
          line = line.replace(`\`${src}\``, expr);
      }
      if (line !== lines[i]) {
        lines[i] = line;
        dirty = true;
      }
    }
    if (dirty) {
      let out = lines.join("\n");
      if (!out.includes("const m = useMessages()")) {
        out = out.replace(
          /^(export (?:default )?function \w+\([^)]*\) \{)/m,
          "$1\n  const m = useMessages();"
        );
      }
      fs.writeFileSync(file, out, "utf8");
    }
  }
}

fs.writeFileSync(
  path.join(ROOT, "scripts/i18n-string-index.json"),
  JSON.stringify(index, null, 2),
  "utf8"
);
saveRest(rest);
console.log(
  `bgRest namespaces: ${Object.keys(rest).length}, keys: ${Object.keys(index).length}`
);