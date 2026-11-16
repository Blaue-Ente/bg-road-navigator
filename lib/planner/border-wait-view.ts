import { isHuRomaniaPreferenceId } from "@/lib/constants/border-official-links";
import { isHungarySerbiaPlannerId } from "@/lib/constants/border-official-links";
import { formatTemplate } from "@/lib/i18n/format-template";
import { catalog, localeTag, type Locale } from "@/lib/i18n/locale";
import { timeZoneLabel } from "@/lib/geo/country-timezone";
import type {
  NakordoniAttribution,
  TripPlannerResult,
  WaitEstimate,
  WaitSource,
} from "@/lib/planner/types";

/** What the plan sheet may say about one crossing. Unlicensed rows never credit Nakordoni. */
export interface BorderWaitView {
  unlicensed: boolean;
  minutes: number;
  trafficDelayMin: number | null;
  source: WaitSource;
  detail: string | null;
  ageLabel: string | null;
  attribution: NakordoniAttribution | null;
}

export interface BorderWaitClockLines {
  arrival: {
    minutes: number;
    timeLabel: string;
    placeLabel: string;
    line: string;
  } | null;
  now: { minutes: number; line: string } | null;
  noData: boolean;
}

export function borderWaitView(wait: WaitEstimate): BorderWaitView {
  if (wait.unlicensed_market === true) {
    return {
      unlicensed: true,
      minutes: wait.minutes,
      trafficDelayMin: finiteDelay(wait.traffic_delay_min),
      source: wait.source,
      detail: null,
      ageLabel: null,
      attribution: null,
    };
  }
  return {
    unlicensed: false,
    minutes: wait.minutes,
    trafficDelayMin: finiteDelay(wait.traffic_delay_min),
    source: wait.source,
    detail: wait.label_bg,
    ageLabel: wait.age_label,
    attribution: wait.attribution,
  };
}

export function planWaitMinutes(
  wait: WaitEstimate | null | undefined
): number | null {
  if (!wait) return null;
  if (wait.metric === "none" || wait.source === "unavailable") return null;
  return wait.minutes;
}

export function planWaitMinutesFromPlan(
  plan: Pick<TripPlannerResult, "border">
): number | null {
  return planWaitMinutes(plan.border.chosen?.wait);
}

export function timeZoneForBorderCrossing(borderId: string): string {
  if (isHuRomaniaPreferenceId(borderId)) return "Europe/Bucharest";
  if (isHungarySerbiaPlannerId(borderId)) return "Europe/Budapest";
  return "Europe/Sofia";
}

export function borderWaitClockLines(
  wait: WaitEstimate,
  locale: Locale,
  borderId: string
): BorderWaitClockLines {
  const sheet = catalog(locale).sheet;
  const timeZone = timeZoneForBorderCrossing(borderId);
  const placeLabel = timeZoneLabel(timeZone, locale);
  if (wait.metric === "none" || wait.source === "unavailable") {
    return { arrival: null, now: null, noData: true };
  }
  const eta =
    wait.eta_iso != null ? new Date(wait.eta_iso) : null;
  const timeLabel =
    eta != null ? formatZonedDateTimeLabel(eta, locale, timeZone) : "";
  const arrival = {
    minutes: wait.minutes,
    timeLabel,
    placeLabel,
    line: formatTemplate(sheet.waitAtArrival, {
      time: timeLabel,
      place: placeLabel,
      minutes: String(wait.minutes),
    }),
  };
  const nowMinutes = wait.now_minutes;
  const now =
    nowMinutes != null
      ? {
          minutes: nowMinutes,
          line: formatTemplate(sheet.waitNowLine, {
            minutes: String(nowMinutes),
          }),
        }
      : null;
  return { arrival, now, noData: false };
}

export function routeChoiceWaitLine(
  wait: WaitEstimate,
  locale: Locale
): string {
  const m = catalog(locale);
  const minutes = planWaitMinutes(wait);
  if (minutes == null) return m.prefs.borderNoWaitData;
  return formatTemplate(m.routeChoice.waitAtArrival, {
    minutes: String(minutes),
  });
}

export function formatZonedDateTimeLabel(
  at: Date,
  locale: Locale,
  timeZone: string
): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(at);
}

export function serbiaHungaryChoices<
  T extends { border_id: string; reason_code: string },
>(alternatives: T[], chosenId: string | null): T[] {
  return alternatives.filter(
    (item) => item.reason_code === "serbia_hungary" && item.border_id !== chosenId
  );
}

function finiteDelay(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value);
}