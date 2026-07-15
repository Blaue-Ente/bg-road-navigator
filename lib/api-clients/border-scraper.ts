/**
 * Border status — Nakordoni live queues (optional) + historical fallback
 * Supports all European crossings (BG + transit borders)
 */

import {
  getAllEuropeanCrossings,
  getCrossingsByIds,
  getCrossingsByRegion,
  getCrossingsForCorridor,
  type EuropeanBorderRegion,
} from "@/lib/constants/european-borders";
import type { BorderCrossing } from "@/lib/constants/border-crossings";
import {
  fetchNakordoniQueues,
  type NakordoniQueueData,
} from "@/lib/api-clients/nakordoni";
import { getNakordoniPageUrl } from "@/lib/constants/nakordoni-checkpoints";
import type { BorderStatus } from "@/types/border.types";

export interface BorderFetchOptions {
  crossingId?: string;
  region?: EuropeanBorderRegion;
  corridorId?: string;
  borderIds?: string[];
}

function waitToStatus(waitMinutes: number): BorderStatus["status"] {
  if (waitMinutes < 30) return "green";
  if (waitMinutes < 60) return "yellow";
  if (waitMinutes < 120) return "orange";
  return "red";
}

function resolveCrossings(options: BorderFetchOptions): BorderCrossing[] {
  if (options.crossingId) {
    return getAllEuropeanCrossings().filter((c) => c.id === options.crossingId);
  }
  if (options.borderIds?.length) {
    return getCrossingsByIds(options.borderIds);
  }
  if (options.corridorId) {
    return getCrossingsForCorridor(options.corridorId);
  }
  if (options.region && options.region !== "all") {
    return getCrossingsByRegion(options.region);
  }
  return getAllEuropeanCrossings();
}

function buildFallbackStatus(crossing: BorderCrossing): BorderStatus {
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
    region: crossing.region,
  };
}

function mergeNakordoni(
  crossing: BorderCrossing,
  live: NakordoniQueueData | undefined
): BorderStatus {
  const waitCars =
    live?.waitMinutes ??
    crossing.typical_wait_minutes[new Date().getHours()] ??
    30;

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
    region: crossing.region,
  };
}

export async function fetchBorderStatus(
  options: BorderFetchOptions = {}
): Promise<BorderStatus[]> {
  const liveQueues = await fetchNakordoniQueues();
  const queueByCrossing = Object.fromEntries(
    liveQueues.map((q) => [q.crossingId, q])
  );

  const hasLiveData = liveQueues.length > 0;
  const crossings = resolveCrossings(options);

  return crossings.map((crossing) => {
    const live = queueByCrossing[crossing.id];
    if (hasLiveData) {
      return mergeNakordoni(crossing, live);
    }
    return buildFallbackStatus(crossing);
  });
}
