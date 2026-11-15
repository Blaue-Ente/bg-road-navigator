import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import { haversineKm } from "@/lib/geo/haversine";
import { listPins } from "@/lib/db/community";
import { isDatabaseConfigured } from "@/lib/db";
import { resolveStationPrice } from "@/lib/fuel-prices/resolve";
import type { KnownPrice } from "@/lib/fuel-prices/types";
import { getEVStations } from "@/lib/api-clients/opencharge";
import { readNakordoniCache } from "@/lib/nakordoni/cache-store";
import { parseDayStats, parseForecast } from "@/lib/nakordoni/parse";
import { assembleTripPlan, type StopAttachment } from "@/lib/planner/assemble";
import {
  selectCandidateBorders,
  scoreBorderOptions,
  type BorderScoreInput,
} from "@/lib/planner/borders";
import { mergeDrivingBreaks, type FuelTimedStop } from "@/lib/planner/breaks";
import { communityAlongRoute } from "@/lib/planner/community";
import { fuelWindows } from "@/lib/planner/fuel-windows";
import {
  distanceToPolylineKm,
  lineLengthKm,
  pointAtDistance,
} from "@/lib/planner/line";
import { chooseStation, type RankedPlace } from "@/lib/planner/stations";
import type { PlanPrice } from "@/lib/planner/types";
import type { ResolvedVehicle } from "@/lib/planner/vehicle";
import { expectedWait, type CurrentQueue } from "@/lib/planner/wait";
import { fetchDirectRoute, fetchRouteThrough } from "@/lib/planner/via-route";
import { placesAlong, type OsmPlace } from "@/lib/osm/corridor";
import type { CommunityPin } from "@/types/community.types";
import type { GeoPoint } from "@/types/route.types";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";

const ON_PATH_KM = 12;
const MAX_VIA = 3;

export interface TripPlanRequest {
  origin: { label: string; coords: GeoPoint; countryCode?: string | null };
  destination: { label: string; coords: GeoPoint; countryCode?: string | null };
  departAt: Date;
  vehicle: ResolvedVehicle;
  fromProfile: boolean;
  breakEveryMin: number;
  now?: Date;
}

export async function runTripPlan(input: TripPlanRequest) {
  const now = input.now ?? new Date();
  const direct = await fetchDirectRoute(
    input.origin.coords,
    input.destination.coords
  );
  if (!direct || direct.geometry.coordinates.length < 2) return null;

  const originCountry =
    input.origin.countryCode ??
    countryCodeAtPoint(input.origin.coords.lng, input.origin.coords.lat);
  const destinationCountry =
    input.destination.countryCode ??
    countryCodeAtPoint(
      input.destination.coords.lng,
      input.destination.coords.lat
    );

  const candidates = selectCandidateBorders({
    origin: input.origin.coords,
    destination: input.destination.coords,
    originCountry,
    destinationCountry,
  });

  const directLine = direct.geometry.coordinates as Array<[number, number]>;
  const onPath = new Set(
    candidates
      .filter(
        (candidate) =>
          distanceToPolylineKm(directLine, candidate.coords).distanceKm <=
          ON_PATH_KM
      )
      .map((candidate) => candidate.id)
  );

  const viaRoutes = new Map<string, ProvidedRoadRoute>();
  let viaCount = 0;
  for (const candidate of candidates) {
    if (onPath.has(candidate.id) || viaCount >= MAX_VIA) continue;
    viaCount += 1;
    const routed = await fetchRouteThrough([
      { ...input.origin.coords, role: "break" },
      { ...candidate.coords, role: "through" },
      { ...input.destination.coords, role: "break" },
    ]);
    if (routed) viaRoutes.set(candidate.id, routed);
  }

  const pins = await pinsNear(
    input,
    candidates.map((candidate) => candidate.coords)
  );
  const waits = await loadWaits(
    candidates
      .map((candidate) => candidate.ppid)
      .filter((ppid): ppid is string => Boolean(ppid)),
    now
  );

  const scoreInputs: BorderScoreInput[] = [];
  for (const candidate of candidates) {
    const routed = onPath.has(candidate.id)
      ? direct
      : viaRoutes.get(candidate.id);
    if (!routed) continue;
    const line = routed.geometry.coordinates as Array<[number, number]>;
    const along = distanceToPolylineKm(line, candidate.coords);
    const driveMin = routed.duration_min;
    const fraction =
      routed.distance_km > 0
        ? Math.min(1, along.alongKm / Math.max(lineLengthKm(line), 1))
        : 0;
    const eta = new Date(
      input.departAt.getTime() + fraction * driveMin * 60_000
    );
    const cached = candidate.ppid ? waits.get(candidate.ppid) : undefined;
    const community = communityAlongRoute(line, pins, now.getTime());
    scoreInputs.push({
      borderId: candidate.id,
      nameBg: candidate.nameBg,
      nameEn: candidate.nameEn,
      coords: candidate.coords,
      ppid: candidate.ppid,
      driveMin,
      distanceKm: routed.distance_km,
      wait: expectedWait({
        eta,
        now,
        forecast: cached?.forecast ?? null,
        dayStats: cached?.dayStats ?? null,
        current: cached?.current ?? null,
        localTypical: candidate.localTypicalMinutes,
      }),
      communityPenaltyMin: community.penaltyMin,
    });
  }

  const borders = scoreBorderOptions(scoreInputs);
  const chosen = borders.find((border) => border.chosen) ?? null;
  const chosenRoute =
    chosen && !onPath.has(chosen.borderId) && viaRoutes.get(chosen.borderId)
      ? viaRoutes.get(chosen.borderId)!
      : direct;
  const chosenLine = chosenRoute.geometry.coordinates as Array<
    [number, number]
  >;
  const roadKm = chosenRoute.distance_km;
  const geometryKm = Math.max(1, lineLengthKm(chosenLine));
  const community = communityAlongRoute(chosenLine, pins, now.getTime());
  const borderAlong =
    chosen == null
      ? null
      : distanceToPolylineKm(chosenLine, chosen.coords).alongKm;

  const windows = fuelWindows(roadKm, input.vehicle);
  const fuelStops: FuelTimedStop[] = windows.map((window) => ({
    kind: input.vehicle.energy === "charge" ? "charge" : "fuel",
    distanceKm: window.windowEndKm,
    etaMin:
      (window.windowEndKm / Math.max(roadKm, 1)) * chosenRoute.duration_min,
  }));
  const merged = mergeDrivingBreaks({
    driveMin: chosenRoute.duration_min,
    distanceKm: roadKm,
    breakEveryMin: input.breakEveryMin,
    mergeWithinMin: 30,
    overnightAfterMin: 630,
    fuelStops,
  });

  const warnings: string[] = [];
  const attachments = await attachPlaces({
    merged,
    line: chosenLine,
    geometryKm,
    roadKm,
    vehicle: input.vehicle,
    warnings,
    now,
  });

  return assembleTripPlan({
    now,
    departAt: input.departAt,
    vehicle: input.vehicle,
    fromProfile: input.fromProfile,
    origin: { label: input.origin.label, coords: input.origin.coords },
    destination: {
      label: input.destination.label,
      coords: input.destination.coords,
    },
    distanceKm: roadKm,
    durationMin: chosenRoute.duration_min,
    geometry: chosenRoute.geometry,
    routingSource: chosenRoute.provider,
    borders,
    borderAlongKm:
      borderAlong == null ? null : (borderAlong / geometryKm) * roadKm,
    merged,
    attachments,
    community,
    warnings,
  });
}

async function attachPlaces(input: {
  merged: ReturnType<typeof mergeDrivingBreaks>;
  line: Array<[number, number]>;
  geometryKm: number;
  roadKm: number;
  vehicle: ResolvedVehicle;
  warnings: string[];
  now: Date;
}): Promise<StopAttachment[]> {
  const attachments: StopAttachment[] = [];
  let fuelPlaces: Array<OsmPlace & RankedPlace> | null = null;
  let fuelAnchor: GeoPoint | null = null;
  let hotelPlaces: OsmPlace[] | null = null;
  let hotelAnchor: GeoPoint | null = null;
  let queries = 0;
  let overpassFailed = false;

  for (const stop of input.merged) {
    const anchor = pointAtDistance(
      input.line,
      (stop.distanceKm / Math.max(input.roadKm, 1)) * input.geometryKm
    );
    const wantsEnergy =
      stop.kinds.includes("fuel") || stop.kinds.includes("charge");
    const wantsHotel = stop.kinds.includes("overnight");
    let place: (OsmPlace & RankedPlace) | null = null;
    let lodgingNote: string | null = null;

    if (wantsEnergy) {
      const stale =
        !fuelPlaces || !fuelAnchor || kmBetween(fuelAnchor, anchor) > 35;
      if (stale && queries < 3) {
        queries += 1;
        const loaded = await loadEnergyPlaces(
          input.line,
          geometryAt(input, Math.max(0, stop.distanceKm - 40)),
          geometryAt(input, stop.distanceKm),
          input.vehicle
        );
        fuelPlaces = loaded.places;
        fuelAnchor = anchor;
        if (!loaded.ok) overpassFailed = true;
      }
      const chosen = fuelPlaces
        ? chooseStation(fuelPlaces, input.line, anchor)
        : null;
      place = chosen?.place ?? null;
    }

    if (wantsHotel) {
      const stale =
        !hotelPlaces || !hotelAnchor || kmBetween(hotelAnchor, anchor) > 35;
      if (stale && queries < 3) {
        queries += 1;
        const loaded = await placesAlong(
          input.line,
          geometryAt(input, Math.max(0, stop.distanceKm - 15)),
          geometryAt(input, stop.distanceKm + 5),
          "hotel"
        );
        hotelPlaces = loaded.places;
        hotelAnchor = anchor;
        if (!loaded.ok) overpassFailed = true;
      }
      const hotel = nearestHotel(hotelPlaces ?? [], anchor);
      if (!place && hotel) {
        place = { ...hotel, priceAmount: null };
      } else if (hotel) {
        lodgingNote = `Наблизо: ${hotel.name}. Оценки още няма.`;
      } else {
        lodgingNote = "Няма зареден хотел от картата. Оценки още няма.";
      }
    }

    let price: PlanPrice | null = null;
    if (
      place &&
      (stop.kinds.includes("fuel") || input.vehicle.energy === "fuel") &&
      stop.kinds.includes("fuel")
    ) {
      const country = countryCodeAtPoint(place.lng, place.lat);
      const fuel =
        input.vehicle.fuel_type === "electric" ? null : input.vehicle.fuel_type;
      if (fuel) {
        const looked = await resolveStationPrice(
          { countryCode: country, fuel, lat: place.lat, lng: place.lng },
          { now: input.now }
        );
        price = toPlanPrice(looked.price);
      }
    }

    attachments.push({
      etaMin: stop.etaMin,
      name: place?.name ?? null,
      brand: place?.brand ?? null,
      coords: place ? { lng: place.lng, lat: place.lat } : null,
      detourKm: place
        ? Math.round(distanceToPolylineKm(input.line, place).distanceKm * 10) /
          10
        : null,
      motorwayService: place?.motorwayService ?? false,
      source: place
        ? place.id.startsWith("ocm-")
          ? "openchargemap"
          : "openstreetmap"
        : "calculated",
      price,
      lodgingNote,
    });
  }

  if (overpassFailed) {
    input.warnings.push(
      "Част от станциите и хотелите не се заредиха. Липсващите спирки са ориентири по пътя."
    );
  }
  return attachments;
}

function geometryAt(
  input: { roadKm: number; geometryKm: number },
  roadKm: number
): number {
  return (roadKm / Math.max(input.roadKm, 1)) * input.geometryKm;
}

async function loadEnergyPlaces(
  line: Array<[number, number]>,
  fromKm: number,
  toKm: number,
  vehicle: ResolvedVehicle
): Promise<{ places: Array<OsmPlace & RankedPlace>; ok: boolean }> {
  if (vehicle.energy === "charge") {
    const osm = await placesAlong(line, fromKm, toKm, "charging_station");
    const anchor = pointAtDistance(line, toKm);
    const ocm = await getEVStations(anchor.lng, anchor.lat, 15);
    const fromOcm: Array<OsmPlace & RankedPlace> = ocm.map((station) => ({
      id: station.id,
      name: station.name,
      brand: station.operator,
      lat: station.coords.lat,
      lng: station.coords.lng,
      kind: "charging_station",
      motorwayService: false,
      priceAmount: null,
    }));
    return {
      places: [
        ...fromOcm,
        ...osm.places.map((place) => ({ ...place, priceAmount: null })),
      ],
      ok: osm.ok || ocm.length > 0,
    };
  }
  const osm = await placesAlong(line, fromKm, toKm, "fuel");
  return {
    places: osm.places.map((place) => ({ ...place, priceAmount: null })),
    ok: osm.ok,
  };
}

function nearestHotel(places: OsmPlace[], anchor: GeoPoint): OsmPlace | null {
  let best: OsmPlace | null = null;
  let bestKm = 12;
  for (const place of places) {
    const km = haversineKm(anchor, { lng: place.lng, lat: place.lat });
    if (km < bestKm) {
      best = place;
      bestKm = km;
    }
  }
  return best;
}

function kmBetween(a: GeoPoint, b: GeoPoint): number {
  return haversineKm(a, b);
}

function toPlanPrice(price: KnownPrice | null): PlanPrice | null {
  if (!price) return null;
  return {
    amount: price.amount,
    currency: price.currency,
    unit: price.unit,
    source: price.source,
    observed_at: price.observedAt,
  };
}

async function pinsNear(
  input: TripPlanRequest,
  extra: GeoPoint[]
): Promise<CommunityPin[]> {
  if (!isDatabaseConfigured()) return [];
  const points = [input.origin.coords, input.destination.coords, ...extra];
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  try {
    return await listPins({
      west: Math.min(...lngs) - 0.4,
      east: Math.max(...lngs) + 0.4,
      south: Math.min(...lats) - 0.4,
      north: Math.max(...lats) + 0.4,
    });
  } catch {
    return [];
  }
}

interface CachedWait {
  forecast: ReturnType<typeof parseForecast> | null;
  dayStats: ReturnType<typeof parseDayStats>;
  current: CurrentQueue | null;
}

async function loadWaits(
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
  const row = payload as CurrentQueue;
  if (row.waitMin == null && row.queueNow == null) return null;
  return {
    waitMin: row.waitMin ?? null,
    queueNow: row.queueNow ?? null,
    quality: row.quality ?? null,
    observedAt: row.observedAt ?? null,
    ageMin: row.ageMin ?? null,
  };
}
