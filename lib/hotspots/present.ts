import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import { pluralRo } from "@/lib/i18n/plural";
import { attributionsFor, hotspotSourceLabel } from "@/lib/hotspots/sources";
import type { Hotspot } from "@/lib/hotspots/types";
import type { WhyReason } from "@/lib/planner/types";

/** @deprecated Use attentionTitle(locale) */
export const ATTENTION_TITLE = catalog("bg").planner.hotspots.attentionTitle;

export function attentionTitle(locale: Locale = "bg"): string {
  return catalog(locale).planner.hotspots.attentionTitle;
}

function severityLabel(
  hotspot: Hotspot,
  locale: Locale
): string {
  const h = catalog(locale).planner.hotspots;
  if (hotspot.fatal > 0) return h.severityHigh;
  if (hotspot.serious > 0) return h.severityMedium;
  return h.severityLow;
}

export function hotspotDetail(hotspot: Hotspot, locale: Locale = "bg"): string {
  const h = catalog(locale).planner.hotspots;
  const source = hotspotSourceLabel(hotspot.source_id, locale);
  const years =
    hotspot.year_from === hotspot.year_to
      ? String(hotspot.year_from)
      : `${hotspot.year_from}–${hotspot.year_to}`;
  return formatTemplate(h.detail, {
    count: String(hotspot.count),
    severity: severityLabel(hotspot, locale),
    source,
    years,
  });
}

export function hotspotWarnings(
  hotspots: Hotspot[],
  locale: Locale = "bg"
): string[] {
  if (hotspots.length === 0) return [];
  const h = catalog(locale).planner.hotspots;
  const title = h.attentionTitle;
  const detail = hotspotDetail(hotspots[0]!, locale);
  return [
    formatTemplate(h.warningOnRoute, {
      title,
      count: String(hotspots.length),
      detail,
    }),
  ];
}

function hotspotReasonDetail(count: number, locale: Locale): string {
  const h = catalog(locale).planner.hotspots;
  if (locale === "en" || locale === "tr") {
    if (count === 1) return h.reasonOne;
    return formatTemplate(h.reasonOther, { count: String(count) });
  }
  if (locale === "ro") {
    const form = pluralRo(count);
    if (form === "one") return h.reasonRoOne;
    if (form === "many") {
      return formatTemplate(h.reasonRoMany, { count: String(count) });
    }
    return formatTemplate(h.reasonRoFew, { count: String(count) });
  }
  if (count === 1) return h.reasonOne;
  return formatTemplate(h.reasonOther, { count: String(count) });
}

export function hotspotReason(
  hotspots: Hotspot[],
  locale: Locale = "bg"
): WhyReason | null {
  if (hotspots.length === 0) return null;
  const h = catalog(locale).planner.hotspots;
  return {
    code: "attention_segment",
    title: h.attentionTitle,
    detail: hotspotReasonDetail(hotspots.length, locale),
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