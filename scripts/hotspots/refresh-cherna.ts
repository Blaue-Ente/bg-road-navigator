/**
 * Rebuild Bulgarian hotspots from the Cherna Pista snapshot.
 *
 * The snapshot is lib/hotspots/data/cherna/MVR_database.zip.
 * Drop a newer export on top of that file (or pass its path) and run:
 *
 *   npx vite-node --config vitest.config.ts scripts/hotspots/refresh-cherna.ts
 *   npx vite-node --config vitest.config.ts scripts/hotspots/refresh-cherna.ts /path/to/newer.zip
 *
 * Other countries in hotspots.json stay as they are.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { clusterAccidents } from "@/lib/hotspots/cluster";
import {
  CORRIDOR_BUFFER_KM,
  corridorPolylines,
  withinCorridor,
} from "@/lib/hotspots/corridor";
import { CHERNA_SOURCE_ID, parseChernaCsv } from "@/lib/hotspots/cherna";
import type { HotspotFile } from "@/lib/hotspots/types";

const SNAPSHOT = "lib/hotspots/data/cherna/MVR_database.zip";
const MANIFEST = "lib/hotspots/data/cherna/snapshot.json";
const HOTSPOTS = "lib/hotspots/data/hotspots.json";

const incoming = process.argv[2];
if (incoming && incoming !== SNAPSHOT) {
  copyFileSync(incoming, SNAPSHOT);
}

const ORIGINAL_SHA =
  "172926bfc0d0de1688ad5d0fba67df9217fd2119b52385b3c6ca1ebbdfafdca4";
const zip = readFileSync(SNAPSHOT);
const sha256 = createHash("sha256").update(zip).digest("hex");
const csv = execFileSync("unzip", ["-p", SNAPSHOT], {
  maxBuffer: 64 * 1024 * 1024,
}).toString("utf8");
const parsed = parseChernaCsv(csv);
const lines = corridorPolylines();
const seen = new Set<string>();
const points = parsed.points.filter((point) => {
  if (!withinCorridor(point.lng, point.lat, lines, CORRIDOR_BUFFER_KM)) {
    return false;
  }
  const key = [
    point.source_id,
    point.year,
    point.kind,
    point.lng.toFixed(5),
    point.lat.toFixed(5),
  ].join("|");
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
const bgHotspots = clusterAccidents(points);

const file = JSON.parse(readFileSync(HOTSPOTS, "utf8")) as HotspotFile;
const kept = file.hotspots.filter(
  (hotspot) => hotspot.source_id !== CHERNA_SOURCE_ID
);
file.hotspots = [...kept, ...bgHotspots];
const counts: Record<string, number> = {};
for (const hotspot of file.hotspots) {
  counts[hotspot.country] = (counts[hotspot.country] ?? 0) + 1;
}
file.counts = counts;
file.generated_at = new Date().toISOString().slice(0, 10);
const note =
  `Bulgaria: Cherna Pista MVR_database.zip, retrieved ${file.generated_at}. ` +
  `CSV dates ${parsed.datedFrom ?? "unknown"} to ${parsed.datedTo ?? "unknown"} ` +
  `(publisher period 2021 to 14 Apr 2025). y/x are WGS84 with a comma decimal. ` +
  `died=да is fatal, injured=да is slight. Property-only rows and rows without coordinates were dropped. ` +
  `Refresh: npx vite-node --config vitest.config.ts scripts/hotspots/refresh-cherna.ts`;
const notes = file.notes.filter((line) => !line.startsWith("Bulgaria:"));
const romania = notes.findIndex((line) => line.startsWith("Romania"));
if (romania === -1) notes.push(note);
else notes.splice(romania, 0, note);
file.notes = notes;
writeFileSync(HOTSPOTS, JSON.stringify(file));

const original = sha256 === ORIGINAL_SHA;
const manifest = {
  file: "MVR_database.zip",
  inner_file: "mrv_database_done.csv",
  sha256,
  bytes: zip.length,
  retrieved_on: original ? "2026-11-15" : file.generated_at,
  archive_timestamp: original ? "20250529213038" : null,
  retrieved_from: original
    ? "https://web.archive.org/web/20250529213038id_/https://chernapista.com/wp-content/uploads/2025/05/MVR_database.zip"
    : "local replacement of MVR_database.zip",
  upstream_file:
    "https://chernapista.com/wp-content/uploads/2025/05/MVR_database.zip",
  upstream_page: "https://chernapista.com/data/",
  wayback_page: original
    ? "https://web.archive.org/web/20250529213022/https://chernapista.com/data/"
    : null,
  licence: "CC BY 4.0",
  period_in_file: `${parsed.datedFrom ?? "unknown"} to ${parsed.datedTo ?? "unknown"}`,
  publisher_period: "2021 to 14 Apr 2025",
  rows: parsed.rows,
  injury_or_fatal_with_coordinates: parsed.withCoordinates,
  corridor_points: points.length,
  hotspots: bgHotspots.length,
  attribution:
    "Данни: Черна писта, chernapista.com, CC BY 4.0, по данни на МВР; данните са обработени",
  refresh:
    "Replace MVR_database.zip with a newer Cherna Pista export, then run: npx vite-node --config vitest.config.ts scripts/hotspots/refresh-cherna.ts",
};
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  JSON.stringify({
    rows: parsed.rows,
    injuryWithCoordinates: parsed.withCoordinates,
    corridorPoints: points.length,
    bgHotspots: bgHotspots.length,
    counts,
    datedFrom: parsed.datedFrom,
    datedTo: parsed.datedTo,
  })
);
