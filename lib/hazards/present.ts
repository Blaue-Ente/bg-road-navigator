import type { RoadHazard, RoadHazardKind } from "@/lib/hazards/types";
import type { WhyReason } from "@/lib/planner/types";

export const DATEX_ATTRIBUTION =
  "Източник: Агенция „Пътна инфраструктура“ (datasheet.api.bg)";

export const HAZARD_LABEL: Record<RoadHazardKind, string> = {
  roadworks: "Ремонт",
  closed: "Затворен път",
  danger: "Опасност",
  conditions: "Лоши условия",
};

const SHEET_LIMIT = 40;

export function hazardLabel(kind: RoadHazardKind): string {
  return HAZARD_LABEL[kind];
}

/** Sofia local time, so a test runner in UTC still shows the bulletin clock. */
export function formatHazardUntil(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone: "Europe/Sofia",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function hazardWarnings(hazards: RoadHazard[]): string[] {
  if (hazards.length === 0) return [];
  const shown = hazards.slice(0, 6);
  const lines = shown.map((hazard) => {
    const where = hazard.road_km_bg ? `${hazard.road_km_bg}. ` : "";
    const until = formatHazardUntil(hazard.valid_until);
    const tail = until ? ` Валидно до ${until}.` : "";
    return `${hazard.label_bg}: ${where}${hazard.text_bg}${tail}`;
  });
  if (hazards.length > shown.length) {
    lines.push(
      `Още ${hazards.length - shown.length} сигнала от АПИ по трасето.`
    );
  }
  lines.push(DATEX_ATTRIBUTION);
  return lines;
}

export function hazardReason(hazards: RoadHazard[]): WhyReason | null {
  if (hazards.length === 0) return null;
  const kinds = [...new Set(hazards.map((hazard) => hazard.label_bg))].join(
    ", "
  );
  const word = hazards.length === 1 ? "сигнал" : "сигнала";
  const place = hazards[0]?.road_km_bg
    ? ` Пример: ${hazards[0].road_km_bg}.`
    : "";
  return {
    code: "road_hazard",
    title: "Обстановка от АПИ",
    detail: `По българската част има ${hazards.length} ${word} (${kinds}).${place}`,
    delta_min: null,
    delta_km: null,
  };
}

export function hazardsForSheet(hazards: RoadHazard[]): RoadHazard[] {
  return hazards.slice(0, SHEET_LIMIT);
}
