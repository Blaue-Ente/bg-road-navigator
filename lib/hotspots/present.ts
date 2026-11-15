import { attributionsFor, hotspotSource } from "@/lib/hotspots/sources";
import type { Hotspot } from "@/lib/hotspots/types";
import type { WhyReason } from "@/lib/planner/types";

export const ATTENTION_TITLE = "Участък за повишено внимание";

export function severityLabel(hotspot: Hotspot): "висока" | "средна" | "ниска" {
  if (hotspot.fatal > 0) return "висока";
  if (hotspot.serious > 0) return "средна";
  return "ниска";
}

export function hotspotDetail(hotspot: Hotspot): string {
  const source =
    hotspotSource(hotspot.source_id)?.label_bg ?? hotspot.source_id;
  const years =
    hotspot.year_from === hotspot.year_to
      ? String(hotspot.year_from)
      : `${hotspot.year_from}–${hotspot.year_to}`;
  return `${hotspot.count} произшествия · тежест ${severityLabel(hotspot)} · ${source} · ${years}`;
}

export function hotspotWarnings(hotspots: Hotspot[]): string[] {
  if (hotspots.length === 0) return [];
  return [
    `${ATTENTION_TITLE}: ${hotspots.length} по маршрута. ${hotspotDetail(hotspots[0]!)}`,
  ];
}

export function hotspotReason(hotspots: Hotspot[]): WhyReason | null {
  if (hotspots.length === 0) return null;
  return {
    code: "attention_segment",
    title: ATTENTION_TITLE,
    detail: `${hotspots.length} участъка с чести катастрофи по избрания маршрут.`,
    delta_min: null,
    delta_km: null,
  };
}

export function hotspotAttribution(hotspots: Hotspot[]): string | null {
  const lines = attributionsFor(hotspots.map((hotspot) => hotspot.source_id));
  return lines.length > 0 ? lines.join(" ") : null;
}

/** Keep the sheet readable on a long corridor. */
export function hotspotsForSheet(hotspots: Hotspot[], limit = 12): Hotspot[] {
  return hotspots.slice(0, limit);
}
