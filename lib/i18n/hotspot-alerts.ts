import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";

export { HOTSPOT_ALERTS } from "@/lib/i18n/locales/hotspot-alerts-defaults";
import { HOTSPOT_ALERTS } from "@/lib/i18n/locales/hotspot-alerts-defaults";

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