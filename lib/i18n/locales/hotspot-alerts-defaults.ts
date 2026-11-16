/** Bulgarian defaults for proximity alerts (tests + bg locale branch). */
export const HOTSPOT_ALERTS = {
  locale: "bg" as const,
  title: "Повишено внимание",
  hotspot: (meters: number) =>
    `След ${meters} м: участък с чести катастрофи. Карайте внимателно.`,
  hazard: (meters: number) =>
    `След ${meters} м: опасност по пътя. Карайте внимателно.`,
};