import type { TripGuide } from "@/lib/ai/trip-guide";
import type { StoredChecklistGroup } from "@/lib/db/schema";
import type { PdfChecklistGroup, TripPdfInput } from "@/lib/pdf/trip-pdf";
import type { ChecklistItem, TripPlannerResult } from "@/lib/planner/types";

/** Words the PDF needs, taken from the page's own message catalog. */
export interface PlanPdfLabels {
  checklistTitle: string;
  checklistHint: string;
  groupCharges: string;
  groupDocuments: string;
  groupWinter: string;
  groupKit: string;
  groupPrep: string;
  stops: string;
  border: string;
  weather: string;
  sleepWhere: string;
  sleepCheck: string;
  aiFootnote: string;
  plainFootnote: string;
  distanceUnit: string;
  drivingWord: string;
  arrivalWord: string;
}

/** A short stable key for "this trip", so replanning it keeps one saved checklist. */
export function checklistPlanKey(
  plan: Pick<TripPlannerResult, "depart_at" | "route">
): string {
  const source = [
    plan.route.origin.label,
    plan.route.destination.label,
    plan.depart_at.slice(0, 10),
  ].join("|");
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) + hash + source.charCodeAt(index)) >>> 0;
  }
  return `cl-${hash.toString(16)}-${source.length}`;
}

function itemOf(item: ChecklistItem) {
  return { id: item.id, title: item.title, detail: item.detail ?? "" };
}

/** The checklist groups of a plan, in the order the page shows them. */
export function checklistGroups(
  plan: TripPlannerResult,
  labels: PlanPdfLabels
): StoredChecklistGroup[] {
  const list = plan.checklist;
  return (
    [
      { id: "charges", title: labels.groupCharges, items: [...list.vignettes, ...list.toll_sections] },
      { id: "documents", title: labels.groupDocuments, items: list.documents },
      { id: "winter", title: labels.groupWinter, items: list.winter },
      { id: "kit", title: labels.groupKit, items: list.kit },
      { id: "prep", title: labels.groupPrep, items: list.prep ?? [] },
    ] as const
  )
    .map((group) => ({
      id: group.id,
      title: group.title,
      items: group.items.map(itemOf),
    }))
    .filter((group) => group.items.length > 0);
}

export function checklistTitle(plan: TripPlannerResult, locale: string): string {
  const date = new Date(plan.depart_at);
  const when = Number.isNaN(date.getTime())
    ? plan.depart_at.slice(0, 10)
    : new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
  return `${when} – ${plan.route.destination.label}`;
}

export function pdfGroupsWithChecks(
  groups: StoredChecklistGroup[],
  checks: Record<string, boolean>
): PdfChecklistGroup[] {
  return groups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      title: item.title,
      detail: item.detail,
      checked: checks[item.id] === true,
    })),
  }));
}

function formatWhen(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/**
 * The PDF's content: the AI's written plan when there is one, otherwise a plain
 * summary built from the plan's own facts, and the checklist as a table.
 */
export function tripPdfInputFromPlan(input: {
  plan: TripPlannerResult;
  guide: TripGuide | null;
  checks: Record<string, boolean>;
  labels: PlanPdfLabels;
  locale: string;
  /** "2 h 30 min" for a number of minutes. */
  duration: (minutes: number) => string;
}): TripPdfInput {
  const { plan, guide, labels, locale } = input;
  const route = plan.route;
  const arrival =
    route.arrive_at ?? new Date(Date.parse(plan.depart_at) + route.total_min * 60_000).toISOString();
  const title = guide?.title || `${route.origin.label} → ${route.destination.label}`;
  const subtitle = [
    `${route.origin.label} → ${route.destination.label}`,
    `${route.distance_km} ${labels.distanceUnit}`,
    `${labels.drivingWord} ${input.duration(route.duration_min)}`,
    `${labels.arrivalWord} ${formatWhen(arrival, locale)}`,
  ].join(" · ");

  let intro = guide?.intro ?? "";
  let sections = guide?.sections ?? [];
  let overnight: TripPdfInput["overnight"] = [];
  let closing = guide?.closing ?? "";

  if (guide) {
    overnight = guide.overnight.map((entry) => ({
      heading: `${labels.sleepWhere}: ${entry.where}`,
      lines: [
        ...(entry.why ? [entry.why] : []),
        ...(entry.check.length > 0
          ? [`${labels.sleepCheck}: ${entry.check.join("; ")}`]
          : []),
      ],
    }));
  } else {
    const stops = plan.stops.filter((stop) => !stop.optional && !stop.kinds.includes("sight"));
    intro = `${route.origin.label} → ${route.destination.label}`;
    sections = [
      ...(stops.length > 0
        ? [
            {
              heading: labels.stops,
              text: stops
                .map(
                  (stop) =>
                    `${formatWhen(stop.eta, locale)} – ${stop.place_name ?? stop.title}. ${stop.reason}`
                )
                .join("\n"),
            },
          ]
        : []),
      ...(plan.border.chosen && plan.border.note
        ? [{ heading: labels.border, text: plan.border.note }]
        : []),
      ...(plan.weather.segments.length > 0
        ? [
            {
              heading: labels.weather,
              text: plan.weather.segments
                .slice(0, 8)
                .map(
                  (segment) =>
                    `${formatWhen(segment.eta, locale)} – ${segment.place ?? `${segment.distance_from_start_km} ${labels.distanceUnit}`}: ${segment.summary_bg}${segment.temperature_c != null ? `, ${Math.round(segment.temperature_c)}°C` : ""}`
                )
                .join("\n"),
            },
          ]
        : []),
    ];
    closing = "";
  }

  const groups = checklistGroups(plan, labels);
  return {
    title,
    subtitle,
    intro,
    sections,
    overnight,
    closing,
    footnote: guide ? labels.aiFootnote : labels.plainFootnote,
    checklistTitle: labels.checklistTitle,
    checklistHint: labels.checklistHint,
    checklist: pdfGroupsWithChecks(groups, input.checks),
  };
}
