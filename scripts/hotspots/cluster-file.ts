import { readFileSync, writeFileSync } from "node:fs";
import { clusterAccidents } from "@/lib/hotspots/cluster";
import {
  CORRIDOR_BUFFER_KM,
  corridorPolylines,
  withinCorridor,
} from "@/lib/hotspots/corridor";
import type { AccidentPoint, HotspotFile } from "@/lib/hotspots/types";

const lines = corridorPolylines();
const raw = readFileSync("/tmp/hotspots/points.jsonl", "utf8");
const points: AccidentPoint[] = [];
const seen = new Set<string>();
for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  const point = JSON.parse(line) as AccidentPoint;
  if (!withinCorridor(point.lng, point.lat, lines, CORRIDOR_BUFFER_KM))
    continue;
  const key = [
    point.source_id,
    point.year,
    point.kind,
    point.lng.toFixed(5),
    point.lat.toFixed(5),
  ].join("|");
  if (seen.has(key)) continue;
  seen.add(key);
  points.push(point);
}

const hotspots = clusterAccidents(points);
const counts: Record<string, number> = {};
for (const hotspot of hotspots) {
  counts[hotspot.country] = (counts[hotspot.country] ?? 0) + 1;
}

let notes: string[] = [];
try {
  const report = JSON.parse(
    readFileSync("/tmp/hotspots/extract-report.json", "utf8")
  ) as { notes?: string[] };
  notes = report.notes ?? [];
} catch {
  notes = [];
}

const file: HotspotFile = {
  generated_at: "2026-11-15",
  radius_m: 400,
  min_count: 3,
  buffer_km: CORRIDOR_BUFFER_KM,
  counts,
  notes,
  hotspots,
};
writeFileSync("lib/hotspots/data/hotspots.json", JSON.stringify(file));
console.log(
  JSON.stringify({ points: points.length, hotspots: hotspots.length, counts })
);
