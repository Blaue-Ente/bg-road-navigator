import type { TripPreferences } from "@/lib/planner/preferences";
import type { WhyReason } from "@/lib/planner/types";

export interface WhyBorder {
  chosen: boolean;
  nameBg: string;
  totalMin: number;
  waitMinutes: number;
  driveMin: number;
  distanceKm: number;
}

export function whyThisRoute(input: {
  borders: WhyBorder[];
  directDurationMin: number;
  directDistanceKm: number;
  chosenDurationMin: number;
  chosenDistanceKm: number;
  incidents: Array<{ title: string; penaltyMin: number }>;
  preferences: TripPreferences;
}): WhyReason[] {
  const reasons: WhyReason[] = [];
  const chosen = input.borders.find((border) => border.chosen) ?? null;
  const alternative = input.borders
    .filter((border) => !border.chosen)
    .sort((a, b) => a.totalMin - b.totalMin)[0];
  if (chosen && alternative) {
    const delta = alternative.totalMin - chosen.totalMin;
    reasons.push({
      code: "border_wait",
      title: `През ${chosen.nameBg}`,
      detail: borderChoiceDetail(chosen, alternative, delta),
      delta_min: delta,
      delta_km: Math.round(alternative.distanceKm - chosen.distanceKm),
    });
  }

  const timeDelta = input.directDurationMin - input.chosenDurationMin;
  if (Math.abs(timeDelta) >= 5) {
    reasons.push({
      code: "time_delta",
      title: timeDelta > 0 ? "По-кратко от директния" : "По-дълго от директния",
      detail: `${Math.abs(timeDelta)} мин разлика спрямо директния маршрут без принуден пункт.`,
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
        distanceDelta > 0
          ? "По-къс от директния"
          : "По-дълъг от директния",
      detail: `${Math.abs(distanceDelta)} км разлика спрямо директния маршрут.`,
      delta_min: null,
      delta_km: distanceDelta,
    });
  }

  for (const incident of input.incidents.filter((item) => item.penaltyMin > 0).slice(0, 3)) {
    reasons.push({
      code: "incident",
      title: "Сигнал по трасето",
      detail: incident.title,
      delta_min: incident.penaltyMin,
      delta_km: null,
    });
  }

  const prefs = input.preferences;
  if (prefs.avoid_motorways) {
    reasons.push(preference("Без магистрали", "Маршрутизацията моли Valhalla да избягва магистрали."));
  }
  if (prefs.avoid_tolls) {
    reasons.push(preference("Без тол и винетки, доколкото може", "Valhalla получава use_tolls 0. Винетните връзки в списъка пак се показват."));
  }
  if (prefs.pace === "scenic") {
    reasons.push(preference("По-спокоен ход", "Край пътя са добавени гледки и забележителности, ако ги има."));
  }
  if (prefs.with_pet) {
    reasons.push(preference("С любимец", "Предпочитани са спирки с зелена площ и места, отбелязани като подходящи за любимец."));
  }
  if (prefs.with_children) {
    reasons.push(preference("С деца", "Почивките са по-чести, а ресторантите и площадките тежат повече."));
  }
  if (prefs.drivers >= 2) {
    reasons.push(preference("Двама шофьори", "Дневният лимит за шофиране е по-дълъг."));
  }
  return reasons;
}

function borderChoiceDetail(
  chosen: WhyBorder,
  alternative: WhyBorder,
  delta: number
): string {
  const overall =
    delta >= 0
      ? `През ${chosen.nameBg} пътят е с около ${Math.abs(delta)} мин по-малко общо време от ${alternative.nameBg}.`
      : `През ${chosen.nameBg} пътят е с около ${Math.abs(delta)} мин повече общо време от ${alternative.nameBg}.`;
  const waitDelta = alternative.waitMinutes - chosen.waitMinutes;
  let wait: string;
  if (waitDelta > 0) {
    wait = `По-кратко чакане на границата: около ${chosen.waitMinutes} мин вместо ${alternative.waitMinutes} мин.`;
  } else if (waitDelta < 0) {
    wait = `По-дълго чакане на границата: около ${chosen.waitMinutes} мин вместо ${alternative.waitMinutes} мин.`;
  } else {
    wait = `Чакане на границата: около ${chosen.waitMinutes} мин и при двата варианта.`;
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
