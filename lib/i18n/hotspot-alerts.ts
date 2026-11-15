/** Bulgarian copy for proximity alerts. Other locales can replace this module. */
export const HOTSPOT_ALERTS = {
  locale: "bg" as const,
  title: "Повишено внимание",
  hotspot: (meters: number) =>
    `След ${meters} м: участък с чести катастрофи. Карайте внимателно.`,
  hazard: (meters: number) =>
    `След ${meters} м: опасност по пътя. Карайте внимателно.`,
};

export function alertText(kind: "hotspot" | "hazard", meters: number): string {
  return kind === "hotspot"
    ? HOTSPOT_ALERTS.hotspot(meters)
    : HOTSPOT_ALERTS.hazard(meters);
}
