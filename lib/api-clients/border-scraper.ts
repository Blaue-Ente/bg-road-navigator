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
import {
  borderCrossingI18n,
  type BorderCrossing,
} from "@/lib/constants/border-crossings";
import {
  fetchNakordoniQueues,
  type NakordoniQueueData,
} from "@/lib/api-clients/nakordoni";
import { getNakordoniPageUrl } from "@/lib/constants/nakordoni-checkpoints";
import {
  HATARINFO_ATTRIBUTION_TEXT,
  isHatarinfoCrossingId,
  isHungarySerbiaPlannerId,
} from "@/lib/constants/border-official-links";
import { loadHatarinfo } from "@/lib/borders/hatarinfo";
import type { HatarinfoPanel } from "@/lib/borders/hatarinfo-parse";
import { isDatabaseConfigured } from "@/lib/db";
import { readNakordoniCache } from "@/lib/nakordoni/cache-store";
import { isCrossingLicensed } from "@/lib/nakordoni/markets";
import { parseDayStats, parseForecast } from "@/lib/nakordoni/parse";
import {
  expectedWait,
  localTypicalMinutes,
  type CurrentQueue,
} from "@/lib/planner/wait";
import { formatTemplate } from "@/lib/i18n/format-template";
import { catalog, type Locale } from "@/lib/i18n/locale";
import type { WaitSource } from "@/lib/planner/types";
import type { BorderStatus } from "@/types/border.types";

export interface BorderFetchOptions {
  crossingId?: string;
  region?: EuropeanBorderRegion;
  corridorId?: string;
  borderIds?: string[];
  locale?: Locale;
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

interface CachedWait {
  forecast: ReturnType<typeof parseForecast> | null;
  dayStats: ReturnType<typeof parseDayStats>;
  current: CurrentQueue | null;
}

async function loadWaitsFromCache(
  ppids: string[],
  now: Date
): Promise<Map<string, CachedWait>> {
  const map = new Map<string, CachedWait>();
  if (ppids.length === 0 || !isDatabaseConfigured()) return map;
  const keys = ppids.flatMap((ppid) => [
    `forecast:${ppid}:24`,
    `day-stats:${ppid}`,
    `live:${ppid}`,
    `border-live:${ppid}`,
  ]);
  let rows: Awaited<ReturnType<typeof readNakordoniCache>> = [];
  try {
    rows = await readNakordoniCache(keys);
  } catch {
    return map;
  }
  const fresh = new Map(
    rows
      .filter((row) => row.expiresAt.getTime() > now.getTime())
      .map((row) => [row.key, row.payload])
  );
  for (const ppid of ppids) {
    const live = asCurrent(fresh.get(`live:${ppid}`));
    const borderLive = asCurrent(fresh.get(`border-live:${ppid}`));
    map.set(ppid, {
      forecast: fresh.has(`forecast:${ppid}:24`)
        ? parseForecast(fresh.get(`forecast:${ppid}:24`))
        : null,
      dayStats: fresh.has(`day-stats:${ppid}`)
        ? parseDayStats(fresh.get(`day-stats:${ppid}`))
        : null,
      current: live ?? borderLive,
    });
  }
  return map;
}

function asCurrent(payload: unknown): CurrentQueue | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as {
    wait_min?: unknown;
    queue_now?: unknown;
    data_quality?: unknown;
    updated_at?: unknown;
    age_minutes?: unknown;
  };
  const waitMin =
    typeof record.wait_min === "number" && Number.isFinite(record.wait_min)
      ? record.wait_min
      : null;
  const queueNow =
    typeof record.queue_now === "number" && Number.isFinite(record.queue_now)
      ? record.queue_now
      : null;
  if (waitMin == null && queueNow == null) return null;
  const quality =
    record.data_quality === "high" || record.data_quality === "low"
      ? record.data_quality
      : null;
  const observedAt =
    typeof record.updated_at === "string" ? record.updated_at : null;
  const ageMin =
    typeof record.age_minutes === "number" && Number.isFinite(record.age_minutes)
      ? record.age_minutes
      : null;
  return {
    waitMin,
    queueNow,
    quality,
    observedAt,
    ageMin,
  };
}

function liveToCurrent(
  live: NakordoniQueueData | undefined,
  now: Date
): CurrentQueue | null {
  if (!live) return null;
  const ageMin = Math.max(
    0,
    Math.round(
      (now.getTime() - new Date(live.updatedAt).getTime()) / 60_000
    )
  );
  return {
    waitMin: live.waitMinutes,
    queueNow: live.queueLength,
    quality: null,
    observedAt: live.updatedAt,
    ageMin: Number.isFinite(ageMin) ? ageMin : null,
  };
}

const NAKORDONI_WAIT_SOURCES: WaitSource[] = [
  "forecast",
  "day_stats",
  "current",
];

function dataSourceFromWait(
  waitSource: WaitSource,
  licensed: boolean
): BorderStatus["data_source"] {
  if (waitSource === "hatarinfo") return "hatarinfo";
  if (licensed && NAKORDONI_WAIT_SOURCES.includes(waitSource)) return "nakordoni";
  return "estimate";
}

function buildStatus(
  crossing: BorderCrossing,
  input: {
    now: Date;
    licensed: boolean;
    cached: CachedWait | undefined;
    live: NakordoniQueueData | undefined;
    hatarinfoMinutes: {
      minutes: number;
      band: "under_15" | "measured";
      observedAt: string;
    } | null;
    locale: Locale;
  }
): BorderStatus {
  const current = input.licensed
    ? input.cached?.current ?? liveToCurrent(input.live, input.now)
    : null;

  const wait = expectedWait({
    eta: input.now,
    now: input.now,
    locale: input.locale,
    forecast: input.licensed ? input.cached?.forecast ?? null : null,
    dayStats: input.licensed ? input.cached?.dayStats ?? null : null,
    current,
    localTypical: crossing.typical_wait_minutes,
    licensed: input.licensed,
    hatarinfo: input.hatarinfoMinutes
      ? {
          minutes: input.hatarinfoMinutes.minutes,
          band: input.hatarinfoMinutes.band,
          observedAt: input.hatarinfoMinutes.observedAt,
        }
      : null,
  });

  const waitCars = wait.minutes;
  const fallbackTypical =
    localTypicalMinutes(crossing.typical_wait_minutes, input.now) ?? 30;

  return {
    crossing_id: crossing.id,
    name_bg: crossing.name_bg,
    name_en: crossing.name_en,
    name_i18n: {
      en: crossing.name_en,
      ...borderCrossingI18n(crossing.id),
    },
    country_pair: crossing.country_pair,
    coords: crossing.coords,
    wait_time_cars: waitCars,
    wait_time_trucks: Math.round(waitCars * 1.5),
    wait_time_buses: Math.round(waitCars * 1.2),
    avg_wait_by_hour: crossing.typical_wait_minutes,
    working_hours: crossing.working_hours,
    status: waitToStatus(waitCars || fallbackTypical),
    last_updated:
      wait.observed_at ?? input.live?.updatedAt ?? input.now.toISOString(),
    queue_length: wait.queue_now ?? input.live?.queueLength,
    nakordoni_url: getNakordoniPageUrl(crossing.id) ?? undefined,
    nakordoni_ppid: crossing.nakordoni_ppid ?? input.live?.ppid,
    data_source: dataSourceFromWait(wait.source, input.licensed),
    region: crossing.region,
    accepted_documents: crossing.accepted_documents,
    document_codes: crossing.document_codes,
    notes_bg: crossing.notes_bg,
    notes_i18n: crossing.notes,
    vehicle_types_allowed: crossing.vehicle_types_allowed,
    derived_heavy_wait: true,
  };
}

export async function fetchBorderStatus(
  options: BorderFetchOptions = {}
): Promise<BorderStatus[]> {
  const locale = options.locale ?? "bg";
  const crossings = resolveCrossings(options);
  const now = new Date();
  const ppids = [
    ...new Set(
      crossings
        .map((crossing) => crossing.nakordoni_ppid)
        .filter((ppid): ppid is string => Boolean(ppid))
    ),
  ];
  const [liveQueues, hatarinfo, waits] = await Promise.all([
    fetchNakordoniQueues(now),
    crossings.some((crossing) => isHatarinfoCrossingId(crossing.id))
      ? loadHatarinfo()
      : Promise.resolve(null),
    loadWaitsFromCache(ppids, now),
  ]);
  const queueByCrossing = Object.fromEntries(
    liveQueues.map((q) => [q.crossingId, q])
  );
  const hatarinfoById = new Map(
    (hatarinfo?.crossings ?? [])
      .filter((crossing) => crossing.id)
      .map((crossing) => [crossing.id as string, crossing])
  );

  return crossings.map((crossing) => {
    const live = queueByCrossing[crossing.id];
    const cached = crossing.nakordoni_ppid
      ? waits.get(crossing.nakordoni_ppid)
      : undefined;
    const licensed =
      !isHungarySerbiaPlannerId(crossing.id) &&
      isCrossingLicensed(crossing.id);
    const reading = hatarinfoById.get(crossing.id);
    const hatarinfoMinutes =
      isHatarinfoCrossingId(crossing.id) && hatarinfo
        ? hatarinfoFromPanel(reading, hatarinfo.fetchedAt)
        : null;
    const status = buildStatus(crossing, {
      now,
      licensed,
      cached,
      live,
      hatarinfoMinutes,
      locale,
    });
    if (!reading || !hatarinfo || status.data_source !== "hatarinfo") {
      return status;
    }
    return applyHatarinfoNotes(status, reading, locale);
  });
}

function hatarinfoFromPanel(
  reading: HatarinfoPanel | undefined,
  fetchedAt: string
): {
  minutes: number;
  band: "under_15" | "measured";
  observedAt: string;
} | null {
  if (!reading) return null;
  const sides = [reading.out, reading.in].filter(
    (side): side is NonNullable<typeof side> => side != null
  );
  if (sides.length === 0) return null;
  const busiest = sides.reduce((best, side) =>
    side.minutes > best.minutes ? side : best
  );
  return {
    minutes: busiest.minutes,
    band: busiest.band,
    observedAt: fetchedAt,
  };
}

function applyHatarinfoNotes(
  status: BorderStatus,
  reading: HatarinfoPanel,
  locale: Locale
): BorderStatus {
  const sides = [reading.out, reading.in].filter(
    (side): side is NonNullable<typeof side> => side != null
  );
  if (sides.length === 0) return status;
  const w = catalog(locale).planner.wait;
  const phrase = (minutes: number, band: "under_15" | "measured") =>
    band === "under_15"
      ? w.hatarinfoPhraseUnder15
      : formatTemplate(w.hatarinfoPhraseMinutes, { minutes: String(minutes) });
  const note = [
    w.hatarinfoNoteTitle,
    reading.out
      ? formatTemplate(w.hatarinfoFromHungary, {
          phrase: phrase(reading.out.minutes, reading.out.band),
        })
      : null,
    reading.in
      ? formatTemplate(w.hatarinfoToHungary, {
          phrase: phrase(reading.in.minutes, reading.in.band),
        })
      : null,
    HATARINFO_ATTRIBUTION_TEXT,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    ...status,
    notes_bg: [status.notes_bg, note].filter(Boolean).join(" "),
  };
}