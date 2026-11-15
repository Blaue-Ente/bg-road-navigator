#!/usr/bin/env node
/**
 * Safe UI migration: replace only quoted attributes and same-line JSX text
 * inside React components. Skips module-level const initializers.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const index = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/i18n-string-index.json"), "utf8")
);

const SKIP = new Set([
  "components/location/TripProximity.test.tsx",
  "components/ui/CountryFlag.tsx",
]);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function inComponentBody(lines, i) {
  let depth = 0;
  let inFunc = false;
  for (let j = 0; j <= i; j++) {
    const ln = lines[j];
    if (/^(export default function|export function|function) \w+/.test(ln.trim()))
      inFunc = true;
    if (ln.includes("{")) depth += (ln.match(/{/g) ?? []).length;
    if (ln.includes("}")) depth -= (ln.match(/}/g) ?? []).length;
  }
  return inFunc && depth > 0;
}

for (const base of ["app", "components"]) {
  const root = path.join(ROOT, base);
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    if (SKIP.has(rel)) continue;
    let text = fs.readFileSync(file, "utf8");
    if (!text.includes('"use client"')) continue;
    if (!text.includes("useMessages")) {
      text = text.replace(
        '"use client";\n',
        '"use client";\n\nimport { useMessages } from "@/components/i18n/LocaleProvider";\n\n'
      );
    }
    const lines = text.split("\n");
    let dirty = false;
    const sorted = Object.entries(index).sort((a, b) => b[0].length - a[0].length);
    for (let i = 0; i < lines.length; i++) {
      if (!inComponentBody(lines, i)) continue;
      let line = lines[i];
      for (const [src, dot] of sorted) {
        if (!line.includes(src)) continue;
        const m = `m.${dot}`;
        line = line.replaceAll(`"${src}"`, `{${m}}`);
        line = line.replaceAll(`'${src}'`, `{${m}}`);
        if (line.includes(`>${src}<`)) line = line.replace(`>${src}<`, `>{${m}}<`);
      }
      if (line !== lines[i]) {
        lines[i] = line;
        dirty = true;
      }
    }
    if (!dirty) continue;
    let out = lines.join("\n");
    if (!out.includes("const m = useMessages()")) {
      out = out.replace(
        /(^(?:export default )?function \w+\([^)]*\) \{)/m,
        "$1\n  const m = useMessages();"
      );
    }
    fs.writeFileSync(file, out, "utf8");
  }
}
console.log("safe-apply done");