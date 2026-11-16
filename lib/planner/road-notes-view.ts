import type { RoadHazard } from "@/lib/hazards/types";
import type { Hotspot } from "@/lib/hotspots/types";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import { pluralRo } from "@/lib/i18n/plural";
import type { RouteWeatherSegment } from "@/lib/planner/types";

export type RoadNoteItem =
  | { kind: "hotspot"; hotspot: Hotspot }
  | { kind: "hazard"; hazard: RoadHazard };

const HAZARD_SCORE: Record<RoadHazard["kind"], number> = {
  closed: 400,
  danger: 300,
  roadworks: 200,
  conditions: 100,
};

function severityScore(item: RoadNoteItem): number {
  if (item.kind === "hotspot") {
    return item.hotspot.severity * 10 + item.hotspot.fatal * 100;
  }
  return HAZARD_SCORE[item.hazard.kind];
}

export function roadNotesSummaryText(total: number, locale: Locale): string {
  const s = catalog(locale).sheet;
  if (locale === "ro") {
    const form = pluralRo(total);
    if (form === "one") return formatTemplate(s.roadNotesSummaryRoOne, { count: String(total) });
    if (form === "many") {
      return formatTemplate(s.roadNotesSummaryRoMany, { count: String(total) });
    }
    return formatTemplate(s.roadNotesSummaryRoFew, { count: String(total) });
  }
  if (total === 1) return s.roadNotesSummaryOne;
  return formatTemplate(s.roadNotesSummaryOther, { count: String(total) });
}

export function roadNotesView(
  hotspots: Hotspot[],
  hazards: RoadHazard[],
  locale: Locale = "bg"
): {
  summary: string;
  top: RoadNoteItem[];
  rest: RoadNoteItem[];
  total: number;
} {
  const items: RoadNoteItem[] = [
    ...hotspots.map((hotspot) => ({ kind: "hotspot" as const, hotspot })),
    ...hazards.map((hazard) => ({ kind: "hazard" as const, hazard })),
  ].sort((left, right) => severityScore(right) - severityScore(left));
  const total = items.length;
  const top = items.slice(0, 3);
  const rest = items.slice(3);
  const summary = roadNotesSummaryText(total, locale);
  return { summary, top, rest, total };
}

function segmentWeatherAlert(segment: RouteWeatherSegment): boolean {
  const code = segment.weather_code;
  if (code != null) {
    if (code >= 95) return true;
    if (code >= 61 && code <= 67) return true;
    if (code >= 71 && code <= 77) return true;
    if ([45, 48, 56, 57, 82, 85, 86].includes(code)) return true;
  }
  if ((segment.wind_kmh ?? 0) >= 50) return true;
  if ((segment.precipitation_mm ?? 0) >= 5) return true;
  return false;
}

export function weatherSegmentsForDisplay(segments: RouteWeatherSegment[]): {
  featured: RouteWeatherSegment[];
  rest: RouteWeatherSegment[];
} {
  if (segments.length <= 3) {
    return { featured: segments, rest: [] };
  }
  const featuredIndexes = new Set<number>([0, segments.length - 1]);
  segments.forEach((segment, index) => {
    if (segmentWeatherAlert(segment)) featuredIndexes.add(index);
  });
  const ordered = [...featuredIndexes].sort((a, b) => a - b);
  const featured = ordered.map((index) => segments[index]!);
  const rest = segments.filter((_, index) => !featuredIndexes.has(index));
  return { featured, rest };
}