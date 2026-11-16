import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { TripPreferences } from "@/lib/planner/preferences";
import type { WhyReason } from "@/lib/planner/types";

export interface WhyBorder {
  chosen: boolean;
  /** Localized crossing name for sentences. */
  name: string;
  /** Kept for fixtures; do not render in non-bg UI. */
  nameBg?: string;
  totalMin: number;
  waitMinutes: number;
  driveMin: number;
  distanceKm: number;
}

export function whyThisRoute(input: {
  locale?: Locale;
  borders: WhyBorder[];
  directDurationMin: number;
  directDistanceKm: number;
  chosenDurationMin: number;
  chosenDistanceKm: number;
  incidents: Array<{ title: string; penaltyMin: number }>;
  preferences: TripPreferences;
}): WhyReason[] {
  const m = catalog(input.locale ?? "bg");
  const p = m.planner.why;
  const reasons: WhyReason[] = [];
  const chosen = input.borders.find((border) => border.chosen) ?? null;
  const alternative = input.borders
    .filter((border) => !border.chosen)
    .sort((a, b) => a.totalMin - b.totalMin)[0];
  if (chosen && alternative) {
    const delta = alternative.totalMin - chosen.totalMin;
    reasons.push({
      code: "border_wait",
      title: formatTemplate(p.viaBorder, { name: chosen.name }),
      detail: borderChoiceDetail(chosen, alternative, delta, p),
      delta_min: delta,
      delta_km: Math.round(alternative.distanceKm - chosen.distanceKm),
    });
  }

  const timeDelta = input.directDurationMin - input.chosenDurationMin;
  if (Math.abs(timeDelta) >= 5) {
    reasons.push({
      code: "time_delta",
      title:
        timeDelta > 0 ? p.fasterThanDirect : p.slowerThanDirect,
      detail: formatTemplate(p.timeDetail, { minutes: String(Math.abs(timeDelta)) }),
      delta_min: timeDelta,
      delta_km: null,
    });
  }
  const distanceDelta = Math.round(
    input.directDistanceKm - input.chosenDistanceKm
  );
  if (Math.abs(distanceDelta) >= 5) {
    reasons.push({
      code: "distance_delta",
      title:
        distanceDelta > 0 ? p.shorterThanDirect : p.longerThanDirect,
      detail: formatTemplate(p.distanceDetail, { km: String(Math.abs(distanceDelta)) }),
      delta_min: null,
      delta_km: distanceDelta,
    });
  }

  for (const incident of input.incidents
    .filter((item) => item.penaltyMin > 0)
    .slice(0, 3)) {
    reasons.push({
      code: "incident",
      title: p.incident,
      detail: incident.title,
      delta_min: incident.penaltyMin,
      delta_km: null,
    });
  }

  const prefs = input.preferences;
  if (prefs.avoid_motorways) {
    reasons.push(preference(p.avoidMotorways, p.avoidMotorwaysDetail));
  }
  if (prefs.avoid_tolls) {
    reasons.push(preference(p.avoidTolls, p.avoidTollsDetail));
  }
  if (prefs.pace === "scenic") {
    reasons.push(preference(p.scenic, p.scenicDetail));
  }
  if (prefs.with_pet) {
    reasons.push(preference(p.pet, p.petDetail));
  }
  if (prefs.with_children) {
    reasons.push(preference(p.children, p.childrenDetail));
  }
  if (prefs.drivers >= 2) {
    reasons.push(preference(p.twoDrivers, p.twoDriversDetail));
  }
  return reasons;
}

function borderChoiceDetail(
  chosen: WhyBorder,
  alternative: WhyBorder,
  delta: number,
  p: ReturnType<typeof catalog>["planner"]["why"]
): string {
  const overall =
    delta >= 0
      ? formatTemplate(p.borderFaster, {
          chosen: chosen.name,
          other: alternative.name,
          delta: String(Math.abs(delta)),
        })
      : formatTemplate(p.borderSlower, {
          chosen: chosen.name,
          other: alternative.name,
          delta: String(Math.abs(delta)),
        });
  const waitDelta = alternative.waitMinutes - chosen.waitMinutes;
  let wait: string;
  if (waitDelta > 0) {
    wait = formatTemplate(p.waitShorter, {
      chosen: String(chosen.waitMinutes),
      other: String(alternative.waitMinutes),
    });
  } else if (waitDelta < 0) {
    wait = formatTemplate(p.waitLonger, {
      chosen: String(chosen.waitMinutes),
      other: String(alternative.waitMinutes),
    });
  } else {
    wait = formatTemplate(p.waitSame, { minutes: String(chosen.waitMinutes) });
  }
  return `${overall} ${wait}`;
}

function preference(title: string, detail: string): WhyReason {
  return {
    code: "preference",
    title,
    detail,
    delta_min: null,
    delta_km: null,
  };
}