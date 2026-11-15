#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const INDEX = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/i18n-string-index.json"), "utf8")
);
const SKIP = new Set([
  "components/location/TripProximity.test.tsx",
  "components/ui/CountryFlag.tsx",
]);
const CYR = /[\u0400-\u04FF]/;
const entries = Object.entries(INDEX).sort((a, b) => b[0].length - a[0].length);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceLiterals(text) {
  let dirty = false;
  for (const [literal, dotPath] of entries) {
    if (!text.includes(literal)) continue;
    const m = `m.${dotPath}`;
    const flex = literal
      .split(/\s+/)
      .filter(Boolean)
      .map(escapeRe)
      .join("\\s+");
    const patterns = [
      [new RegExp(`="${escapeRe(literal)}"`, "g"), `={${m}}`],
      [new RegExp(`='${escapeRe(literal)}'`, "g"), `={${m}}`],
      [new RegExp(`>\\s*${escapeRe(literal)}\\s*<`, "gs"), `>{${m}}<`],
      [new RegExp(`>\\s*${flex}\\s*<`, "gs"), `>{${m}}<`],
      [
        new RegExp(`([\\w.]+\\(\\s*)"${escapeRe(literal)}"(\\s*[,)])`, "g"),
        `$1${m}$2`,
      ],
      [new RegExp(`(\\w+):\\s*"${escapeRe(literal)}"`, "g"), `$1: ${m}`],
      [new RegExp(`\\?\\s*"${escapeRe(literal)}"`, "g"), `? ${m}`],
      [new RegExp(`:\\s*"${escapeRe(literal)}"`, "g"), `: ${m}`],
      [new RegExp(`=\\s*"${escapeRe(literal)}"`, "g"), `= ${m}`],
    ];
    for (const [re, repl] of patterns) {
      const next = text.replace(re, repl);
      if (next !== text) {
        text = next;
        dirty = true;
      }
    }
  }
  return { text, dirty };
}

function stripBadHooks(text) {
  return text.replace(
    /^(function [a-z]\w*\([^)]*\) \{)\n  const m = useMessages\(\);\n/gm,
    "$1\n"
  );
}

function injectHooks(text) {
  const re =
    /^export (?:default )?function ([A-Z]\w*)\([^)]*\) \{/gm;
  let match;
  let out = text;
  const inserts = [];
  while ((match = re.exec(text)) !== null) {
    const start = match.index + match[0].length;
    const slice = text.slice(start, start + 80);
    if (!slice.includes("const m = useMessages()")) {
      inserts.push({ at: start, name: match[1] });
    }
  }
  if (inserts.length === 0) return out;
  inserts.sort((a, b) => b.at - a.at);
  for (const { at } of inserts) {
    out = `${out.slice(0, at)}\n  const m = useMessages();${out.slice(at)}`;
  }
  return out;
}

function ensureImport(text) {
  if (!text.includes('"use client"') || text.includes("useMessages")) {
    if (text.includes("useMessages") && !text.includes("LocaleProvider"))
      return text.replace(
        /"use client";\n/,
        '"use client";\n\nimport { useMessages } from "@/components/i18n/LocaleProvider";\n'
      );
    return text;
  }
  return text.replace(
    /"use client";\n/,
    '"use client";\n\nimport { useMessages } from "@/components/i18n/LocaleProvider";\n'
  );
}

let n = 0;
for (const base of ["app", "components"]) {
  const root = path.join(ROOT, base);
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    if (SKIP.has(rel)) continue;
    const initialText = fs.readFileSync(file, "utf8");
    let text = initialText;
    if (!text.includes('"use client"') || !CYR.test(text)) continue;
    text = ensureImport(text);
    text = stripBadHooks(text);
    const { text: next, dirty } = replaceLiterals(text);
    text = next;
  const withHook =
      text.includes("m.") || dirty
        ? injectHooks(text)
        : text;
    if (withHook !== initialText) {
      fs.writeFileSync(file, withHook, "utf8");
      n++;
    }
  }
}
console.log(`patched ${n} files`);