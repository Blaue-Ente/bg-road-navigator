import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";

/** Bulgarian copy kept for tests and default notifications. */
export const HOTSPOT_ALERTS = {
  locale: "bg" as const,
  title: "Повишено внимание",
  hotspot: (meters: number) =>
    `След ${meters} м: участък с чести катастрофи. Карайте внимателно.`,
  hazard: (meters: number) =>
    `След ${meters} м: опасност по пътя. Карайте внимателно.`,
};

export function proximityAlertTitle(locale: Locale = "bg"): string {
  if (locale === "bg") return HOTSPOT_ALERTS.title;
  return catalog(locale).planner.hotspots.attentionTitle;
}

export function alertText(
  kind: "hotspot" | "hazard",
  meters: number,
  locale: Locale = "bg"
): string {
  if (locale === "bg") {
    return kind === "hotspot"
      ? HOTSPOT_ALERTS.hotspot(meters)
      : HOTSPOT_ALERTS.hazard(meters);
  }
  const p = catalog(locale).planner.proximity;
  const template =
    kind === "hotspot" ? p.hotspotAhead : p.hazardAhead;
  return formatTemplate(template, { meters: String(meters) });
}