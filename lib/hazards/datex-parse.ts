import { XMLParser } from "fast-xml-parser";
import { hazardLabel } from "@/lib/hazards/present";
import type { RoadHazard, RoadHazardKind } from "@/lib/hazards/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  removeNSPrefix: true,
  trimValues: true,
  isArray: (tagName) =>
    tagName === "situation" ||
    tagName === "situationRecord" ||
    tagName === "pointByCoordinates" ||
    tagName === "comment" ||
    tagName === "value",
});

/**
 * DATEX II SituationPublication → plan hazards.
 *
 * Every feed currently stamps xsi:type="Roadworks", including accidents and
 * bad conditions. The folder name is not an input. A nested record element
 * other than the roadworks wrapper wins; otherwise the Bulgarian comment does.
 */
export function parseDatexSituations(
  xml: string,
  options?: { now?: Date }
): RoadHazard[] {
  const now = options?.now ?? new Date();
  let root: unknown;
  try {
    root = parser.parse(xml);
  } catch {
    return [];
  }
  const situations = situationsOf(root);
  const hazards: RoadHazard[] = [];
  for (const situation of situations) {
    const situationId = attr(situation, "id") ?? "";
    for (const record of asArray(situation.situationRecord)) {
      const hazard = toHazard(situationId, record, now);
      if (hazard) hazards.push(hazard);
    }
  }
  return hazards;
}

export function classifyHazard(
  record: Record<string, unknown>,
  text: string
): RoadHazardKind {
  const nested = nestedKind(record);
  const fromText = textKind(text);
  if (nested && nested !== "roadworks") return nested;
  if (fromText) return fromText;
  if (nested) return nested;
  return "roadworks";
}

export function roadKmLabel(text: string): string | null {
  const km = text.match(/км\.?\s*(\d+(?:[+.]\d+)?)/i);
  const motorway = text.match(
    /АМ\s+[„"«]?([A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё\-]*)/
  );
  const numbered =
    text.match(/път\s+([IVX]{1,4}-\d+)/i) ?? text.match(/\b([IVX]{1,4}-\d+)\b/);
  const road = motorway
    ? `АМ ${motorway[1]}`
    : numbered
      ? `път ${numbered[1]}`
      : null;
  if (road && km) return `${road}, км ${km[1]}`;
  if (road) return road;
  if (km) return `км ${km[1]}`;
  return null;
}

function toHazard(
  situationId: string,
  record: Record<string, unknown>,
  now: Date
): RoadHazard | null {
  const point = firstPoint(record);
  if (!point) return null;
  const text = commentText(record);
  if (!text) return null;
  const validUntil = endTime(record);
  if (validUntil) {
    const end = new Date(validUntil);
    if (!Number.isNaN(end.getTime()) && end.getTime() <= now.getTime()) {
      return null;
    }
  }
  const kind = classifyHazard(record, text);
  const recordId = attr(record, "id");
  return {
    id: recordId ?? situationId ?? `${point.lng},${point.lat},${kind}`,
    kind,
    label_bg: hazardLabel(kind),
    text_bg: text,
    road_km_bg: roadKmLabel(text),
    valid_until: validUntil,
    lng: point.lng,
    lat: point.lat,
  };
}

function nestedKind(record: Record<string, unknown>): RoadHazardKind | null {
  if (record.accident || record.vehicleObstruction) return "danger";
  const management = asRecord(record.roadOrCarriagewayOrLaneManagement);
  const managementType = flatText(
    management?.roadOrCarriagewayOrLaneManagementType
  );
  if (/clos|затвор/i.test(managementType)) return "closed";
  if (
    record.poorEnvironmentConditions ||
    record.weatherRelatedRoadConditions ||
    record.nonWeatherRelatedRoadConditions
  ) {
    return "conditions";
  }
  if (record.roadworks || record.maintenanceWorks) return "roadworks";
  return null;
}

function textKind(text: string): RoadHazardKind | null {
  const value = text.toLowerCase();
  const laneClosure =
    /затворен[а-я]*\s+(?:лява|дясна|активна|аварийна)?\s*лента/.test(value);
  if (!laneClosure && /затвор|закрит|спряно движение/.test(value))
    return "closed";
  if (/птп|катастроф|произшеств|авария/.test(value)) return "danger";
  if (/опасност|опасен|препятств/.test(value)) return "danger";
  if (
    /хлъзгав|неравн|дупк|поледиц|аквапланинг|мъгла|заледен|лоши условия|лошо състояние|наводн|сняг|дъжд/.test(
      value
    )
  ) {
    return "conditions";
  }
  if (/ремонт|строител|пътни работи|асфалт|стеснен/.test(value)) {
    return "roadworks";
  }
  return null;
}

function situationsOf(root: unknown): Array<Record<string, unknown>> {
  const model = asRecord(root);
  const publication = asRecord(
    model?.d2LogicalModel
      ? asRecord(model.d2LogicalModel)?.payloadPublication
      : model?.payloadPublication
  );
  return asArray(publication?.situation);
}

function firstPoint(
  record: Record<string, unknown>
): { lng: number; lat: number } | null {
  const group = asRecord(record.groupOfLocations);
  for (const point of asArray(group?.pointByCoordinates)) {
    const coords = asRecord(point.pointCoordinates);
    const lat = numberOf(coords?.latitude);
    const lng = numberOf(coords?.longitude);
    if (lat == null || lng == null) continue;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    return { lat, lng };
  }
  return null;
}

function commentText(record: Record<string, unknown>): string {
  const block = asRecord(record.generalPublicComment);
  const comments = asArray(block?.comment);
  const bg: string[] = [];
  const other: string[] = [];
  for (const comment of comments) {
    const values = asRecord(comment.values);
    for (const value of asArray(values?.value)) {
      const text = textOf(value).trim();
      if (!text) continue;
      if (langOf(value).startsWith("bg")) bg.push(text);
      else other.push(text);
    }
  }
  return (bg.length > 0 ? bg : other).join(" ");
}

function endTime(record: Record<string, unknown>): string | null {
  const validity = asRecord(record.validity);
  const spec = asRecord(validity?.validityTimeSpecification);
  const raw = spec?.overallEndTime;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number") return String(raw);
  return null;
}

function langOf(node: unknown): string {
  const row = asRecord(node);
  if (!row) return "";
  const lang = row["@_lang"] ?? row["@_xml:lang"] ?? "";
  return String(lang).toLowerCase();
}

function attr(node: Record<string, unknown>, name: string): string | null {
  const value = node[`@_${name}`];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

function textOf(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  const row = asRecord(node);
  if (!row) return "";
  const text = row["#text"];
  if (typeof text === "string" || typeof text === "number") return String(text);
  return "";
}

function flatText(node: unknown): string {
  return textOf(node).trim();
}

function numberOf(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const row = asRecord(value);
  if (!row) return null;
  return numberOf(row["#text"]);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item)
  );
}
