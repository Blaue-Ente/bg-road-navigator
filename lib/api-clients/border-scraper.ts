/**
 * Border status — Nakordoni live queues (optional) + historical fallback
 */

import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import {
  fetchNakordoniQueues,
  type NakordoniQueueData,
} from "@/lib/api-clients/nakordoni";
import { getNakordoniPageUrl } from "@/lib/constants/nakordoni-checkpoints";
import type { BorderStatus } from "@/types/border.types";

function waitToStatus(waitMinutes: number): BorderStatus["status"] {
  if (waitMinutes < 30) return "green";
  if (waitMinutes < 60) return "yellow";
  if (waitMinutes < 120) return "orange";
  return "red";
}

function buildFallbackStatus(
  crossing: (typeof BORDER_CROSSINGS)[number]
): BorderStatus {
  const hour = new Date().getHours();
  const baseWait = crossing.typical_wait_minutes[hour] ?? 30;
  const waitCars = Math.round(baseWait);

  return {
    crossing_id: crossing.id,
    name_bg: crossing.name_bg,
    name_en: crossing.name_en,
    country_pair: crossing.country_pair,
    coords: crossing.coords,
    wait_time_cars: waitCars,
    wait_time_trucks: Math.round(waitCars * 1.5),
    wait_time_buses: Math.round(waitCars * 1.2),
    avg_wait_by_hour: crossing.typical_wait_minutes,
    working_hours: crossing.working_hours,
    status: waitToStatus(waitCars),
    last_updated: new Date().toISOString(),
    nakordoni_url: getNakordoniPageUrl(crossing.id) ?? undefined,
    data_source: "estimate",
  };
}

function mergeNakordoni(
  crossing: (typeof BORDER_CROSSINGS)[number],
  live: NakordoniQueueData | undefined
): BorderStatus {
  const waitCars = live?.waitMinutes ?? crossing.typical_wait_minutes[new Date().getHours()] ?? 30;

  return {
    crossing_id: crossing.id,
    name_bg: crossing.name_bg,
    name_en: crossing.name_en,
    country_pair: crossing.country_pair,
    coords: crossing.coords,
    wait_time_cars: waitCars,
    wait_time_trucks: Math.round(waitCars * 1.4),
    wait_time_buses: Math.round(waitCars * 1.15),
    avg_wait_by_hour: crossing.typical_wait_minutes,
    working_hours: crossing.working_hours,
    status: waitToStatus(waitCars),
    last_updated: live?.updatedAt ?? new Date().toISOString(),
    queue_length: live?.queueLength,
    nakordoni_url: getNakordoniPageUrl(crossing.id) ?? undefined,
    nakordoni_ppid: live?.ppid,
    data_source: live ? "nakordoni" : "estimate",
  };
}

export async function fetchBorderStatus(
  crossingId?: string
): Promise<BorderStatus[]> {
  const liveQueues = await fetchNakordoniQueues();
  const queueByCrossing = Object.fromEntries(
    liveQueues.map((q) => [q.crossingId, q])
  );

  const hasLiveData = liveQueues.length > 0;
  const crossings = crossingId
    ? BORDER_CROSSINGS.filter((c) => c.id === crossingId)
    : BORDER_CROSSINGS;

  const results = crossings.map((crossing) => {
    const live = queueByCrossing[crossing.id];
    if (hasLiveData && live) {
      return mergeNakordoni(crossing, live);
    }
    if (hasLiveData) {
      return mergeNakordoni(crossing, undefined);
    }
    return buildFallbackStatus(crossing);
  });

  return results;
}
