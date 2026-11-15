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
import {
  HATARINFO_ATTRIBUTION_TEXT,
  isHatarinfoCrossingId,
} from "@/lib/constants/border-official-links";
import { loadHatarinfo } from "@/lib/borders/hatarinfo";
import type { HatarinfoPanel } from "@/lib/borders/hatarinfo-parse";
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
    accepted_documents: crossing.accepted_documents,
    notes_bg: crossing.notes_bg,
    vehicle_types_allowed: crossing.vehicle_types_allowed,
    derived_heavy_wait: true,
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
    accepted_documents: crossing.accepted_documents,
    notes_bg: crossing.notes_bg,
    vehicle_types_allowed: crossing.vehicle_types_allowed,
    derived_heavy_wait: true,
  };
}

export async function fetchBorderStatus(
  options: BorderFetchOptions = {}
): Promise<BorderStatus[]> {
  const crossings = resolveCrossings(options);
  const [liveQueues, hatarinfo] = await Promise.all([
    fetchNakordoniQueues(),
    crossings.some((crossing) => isHatarinfoCrossingId(crossing.id))
      ? loadHatarinfo()
      : Promise.resolve(null),
  ]);
  const queueByCrossing = Object.fromEntries(
    liveQueues.map((q) => [q.crossingId, q])
  );
  const hatarinfoById = new Map(
    (hatarinfo?.crossings ?? [])
      .filter((crossing) => crossing.id)
      .map((crossing) => [crossing.id as string, crossing])
  );

  const hasLiveData = liveQueues.length > 0;
  return crossings.map((crossing) => {
    const live = queueByCrossing[crossing.id];
    const status = hasLiveData
      ? mergeNakordoni(crossing, live)
      : buildFallbackStatus(crossing);
    if (status.data_source === "nakordoni") return status;
    const reading = hatarinfoById.get(crossing.id);
    if (!reading || !hatarinfo) return status;
    return applyHatarinfo(status, reading, hatarinfo.fetchedAt);
  });
}

function applyHatarinfo(
  status: BorderStatus,
  reading: HatarinfoPanel,
  fetchedAt: string
): BorderStatus {
  const sides = [reading.out, reading.in].filter(
    (side): side is NonNullable<typeof side> => side != null
  );
  if (sides.length === 0) return status;
  const cars = Math.max(...sides.map((side) => side.minutes));
  const phrase = (minutes: number, band: "under_15" | "measured") =>
    band === "under_15" ? "няма чакане над 15 мин" : `${minutes} мин`;
  const note = [
    "Hárinfó, леки коли.",
    reading.out ? `От Унгария: ${phrase(reading.out.minutes, reading.out.band)}.` : null,
    reading.in ? `Към Унгария: ${phrase(reading.in.minutes, reading.in.band)}.` : null,
    HATARINFO_ATTRIBUTION_TEXT,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    ...status,
    wait_time_cars: cars,
    wait_time_trucks: Math.round(cars * 1.5),
    wait_time_buses: Math.round(cars * 1.2),
    status: waitToStatus(cars),
    last_updated: fetchedAt,
    data_source: "hatarinfo",
    notes_bg: [status.notes_bg, note].filter(Boolean).join(" "),
    derived_heavy_wait: true,
  };
}
