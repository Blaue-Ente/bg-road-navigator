import { roadKmDisplay } from "@/lib/hazards/road-km";
import type { RoadHazard, RoadHazardKind } from "@/lib/hazards/types";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { WhyReason } from "@/lib/planner/types";

export const DATEX_ATTRIBUTION =
  "Източник: Агенция „Пътна инфраструктура“ (datasheet.api.bg)";

export function datexAttribution(locale: Locale = "bg"): string {
  return catalog(locale).planner.hazards.attribution;
}

/** @deprecated Use hazardLabel(kind, locale) */
export const HAZARD_LABEL: Record<RoadHazardKind, string> = {
  roadworks: "Ремонт",
  closed: "Затворен път",
  danger: "Опасност",
  conditions: "Лоши условия",
};

const SHEET_LIMIT = 40;

const INTL_LOCALE: Record<Locale, string> = {
  bg: "bg-BG",
  en: "en-GB",
  tr: "tr-TR",
  ro: "ro-RO",
};

export function hazardLabel(
  kind: RoadHazardKind,
  locale: Locale = "bg"
): string {
  if (locale === "bg") return HAZARD_LABEL[kind];
  return catalog(locale).planner.hazards[kind];
}

export function formatHazardUntil(
  iso: string | null,
  locale: Locale = "bg"
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: "Europe/Sofia",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function hazardLine(hazard: RoadHazard, locale: Locale): string {
  const h = catalog(locale).planner.hazards;
  const label = hazardLabel(hazard.kind, locale);
  const until = formatHazardUntil(hazard.valid_until, locale);
  const untilPart = until
    ? formatTemplate(h.validUntil, { until })
    : "";
  if (locale === "bg") {
    const where = hazard.road_km_bg ? `${hazard.road_km_bg}. ` : "";
    return `${hazard.label_bg}: ${where}${hazard.text_bg}${untilPart}`;
  }
  const road = roadKmDisplay(hazard.road_km_bg, hazard.text_bg, locale);
  const where = road ? `${road}. ` : "";
  const text = road ? "" : `${h.agencyDetailsOnly} `;
  return formatTemplate(h.lineUntil, {
    label,
    where,
    text,
    until: untilPart,
  });
}

export function hazardWarnings(
  hazards: RoadHazard[],
  locale: Locale = "bg"
): string[] {
  if (hazards.length === 0) return [];
  const h = catalog(locale).planner.hazards;
  const shown = hazards.slice(0, 6);
  const lines = shown.map((hazard) => hazardLine(hazard, locale));
  if (hazards.length > shown.length) {
    lines.push(
      formatTemplate(h.moreSignals, {
        count: String(hazards.length - shown.length),
      })
    );
  }
  lines.push(datexAttribution(locale));
  return lines;
}

function hazardReasonDetail(
  hazards: RoadHazard[],
  locale: Locale
): { detail: string; title: string } {
  const h = catalog(locale).planner.hazards;
  const kinds = [...new Set(hazards.map((hazard) => hazardLabel(hazard.kind, locale)))].join(
    ", "
  );
  const signals =
    hazards.length === 1 ? h.signalOne : h.signalOther;
  const placeRoad = hazards[0]
    ? roadKmDisplay(hazards[0].road_km_bg, hazards[0].text_bg, locale)
    : null;
  const place =
    placeRoad != null
      ? formatTemplate(h.reasonExample, { place: placeRoad })
      : locale === "bg" && hazards[0]?.road_km_bg
        ? formatTemplate(h.reasonExample, { place: hazards[0].road_km_bg })
        : "";

  const count = String(hazards.length);
  let detail: string;
  if (locale === "en") {
    detail = formatTemplate(h.reasonEn, { count, kinds, place });
  } else if (locale === "tr") {
    detail = formatTemplate(h.reasonTr, { count, kinds, place });
  } else if (locale === "ro") {
    detail = formatTemplate(h.reasonRo, { count, kinds, place });
  } else {
    detail = formatTemplate(h.reasonDetail, { count, signals, kinds, place });
  }
  return { title: h.reasonTitle, detail };
}

export function hazardReason(
  hazards: RoadHazard[],
  locale: Locale = "bg"
): WhyReason | null {
  if (hazards.length === 0) return null;
  const { title, detail } = hazardReasonDetail(hazards, locale);
  return {
    code: "road_hazard",
    title,
    detail,
    delta_min: null,
    delta_km: null,
  };
}

export function hazardsForSheet(hazards: RoadHazard[]): RoadHazard[] {
  return hazards.slice(0, SHEET_LIMIT);
}

export function hazardPopupBody(
  hazard: RoadHazard,
  locale: Locale = "bg"
): string {
  if (locale === "bg") return hazard.text_bg;
  const road = roadKmDisplay(hazard.road_km_bg, hazard.text_bg, locale);
  if (road) return road;
  return catalog(locale).planner.hazards.agencyDetailsOnly;
}