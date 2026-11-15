import { getEVStations } from "@/lib/api-clients/opencharge";
import {
  countryCodeAtPoint,
  countriesAlongRoute,
} from "@/lib/geo/countries-along-route";
import { haversineKm } from "@/lib/geo/haversine";
import { listPins } from "@/lib/db/community";
import { isDatabaseConfigured } from "@/lib/db";
import { listValidFuelReports } from "@/lib/db/fuel-reports";
import { listPlaceFlags } from "@/lib/db/place-flags";
import { readLatestAverageDetails } from "@/lib/fuel-prices/national-store";
import { fuelAveragesForCountries } from "@/lib/fuel-prices/present";
import { resolveStationPrice } from "@/lib/fuel-prices/resolve";
import type { KnownPrice } from "@/lib/fuel-prices/types";
import { readNakordoniCache } from "@/lib/nakordoni/cache-store";
import { parseDayStats, parseForecast } from "@/lib/nakordoni/parse";
import { loadCorridorPlaces } from "@/lib/poi/load-corridor";
import type { CorridorPlace } from "@/lib/poi/types";
import { assembleTripPlan } from "@/lib/planner/assemble";
import { attachStops } from "@/lib/planner/attach-stops";
import {
  applyPreferredBorder,
  selectCandidateBorders,
  scoreBorderOptions,
  type BorderScoreInput,
} from "@/lib/planner/borders";
import { mergeDrivingBreaks, type FuelTimedStop } from "@/lib/planner/breaks";
import { buildChecklist } from "@/lib/planner/checklist";
import { trafficDelayNearBorder } from "@/lib/planner/border-traffic";
import { communityAlongRoute } from "@/lib/planner/community";
import { isCrossingLicensed } from "@/lib/nakordoni/markets";
import { aggregateFlags } from "@/lib/planner/flag-score";
import { fuelWindows } from "@/lib/planner/fuel-windows";
import {
  distanceToPolylineKm,
  lineLengthKm,
  pointAtDistance,
} from "@/lib/planner/line";
import { annotatePlaces, type AnnotatedPlace } from "@/lib/planner/pick-place";
import {
  allowsBorder,
  childAmenityTypes,
  costingFromPreferences,
  drivingDayLimits,
  effectiveBreakEveryMin,
  scenicTypes,
  type TripPreferences,
} from "@/lib/planner/preferences";
import { weatherAlongRoute } from "@/lib/planner/route-weather";
import type { ResolvedVehicle } from "@/lib/planner/vehicle";
import { expectedWait, type CurrentQueue } from "@/lib/planner/wait";
import { whyThisRoute } from "@/lib/planner/why-route";
import { routeThroughPoints } from "@/lib/planner/via-points";
import { fetchDirectRoute, fetchRouteThrough } from "@/lib/planner/via-route";
import { getRouteTolls } from "@/lib/utils/route-tolls";
import type { CommunityPin } from "@/types/community.types";
import type { GeoPoint } from "@/types/route.types";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";

const ON_PATH_KM = 12;
const MAX_VIA = 3;
const PRICE_LOOKUPS = 8;

export interface TripPlanRequest {
  origin: { label: string; coords: GeoPoint; countryCode?: string | null };
  destination: { label: string; coords: GeoPoint; countryCode?: string | null };
  departAt: Date;
  vehicle: ResolvedVehicle;
  fromProfile: boolean;
  preferences: TripPreferences;
  /** Optional user waypoints, at most three. Empty keeps origin → destination. */
  via?: Array<{ label: string; coords: GeoPoint }>;
  now?: Date;
}

export async function runTripPlan(input: TripPlanRequest) {
  const now = input.now ?? new Date();
  const prefs = input.preferences;
  const costing = costingFromPreferences(prefs);
  const day = drivingDayLimits(prefs);

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
  }).filter((candidate) => allowsBorder(candidate.id, prefs));

  const viaCoords = (input.via ?? [])
    .slice(0, MAX_VIA)
    .map((point) => point.coords);
  const [direct, viaList, pins, waits, traffic] = await Promise.all([
    viaCoords.length === 0
      ? fetchDirectRoute(input.origin.coords, input.destination.coords, costing)
      : fetchRouteThrough(
          routeThroughPoints(
            input.origin.coords,
            viaCoords,
            input.destination.coords
          ),
          costing
        ),
    Promise.all(
      candidates.slice(0, MAX_VIA).map(async (candidate) => {
        const routed = await fetchRouteThrough(
          routeThroughPoints(
            input.origin.coords,
            viaCoords,
            input.destination.coords,
            candidate.coords
          ),
          costing
        );
        return [candidate.id, routed] as const;
      })
    ),
    pinsNear(
      input,
      candidates.map((candidate) => candidate.coords)
    ),
    loadWaits(
      candidates
        .map((candidate) => candidate.ppid)
        .filter((ppid): ppid is string => Boolean(ppid)),
      now
    ),
    borderTraffic(candidates),
  ]);
  if (!direct || direct.geometry.coordinates.length < 2) return null;

  const viaRoutes = new Map(
    viaList.filter((entry): entry is [string, ProvidedRoadRoute] =>
      Boolean(entry[1])
    )
  );
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
        licensed: isCrossingLicensed(candidate.id),
        trafficDelayMin: traffic.get(candidate.id) ?? null,
      }),
      communityPenaltyMin: community.penaltyMin,
    });
  }

  const borders = applyPreferredBorder(
    scoreBorderOptions(scoreInputs),
    prefs.preferred_border
  );
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
  const countries = countriesAlongRoute({
    geometry: chosenRoute.geometry,
    origin: { coords: input.origin.coords },
    destination: { coords: input.destination.coords },
  });
  const bulletinFuel =
    input.vehicle.fuel_type === "petrol" || input.vehicle.fuel_type === "diesel"
      ? input.vehicle.fuel_type
      : null;

  const [corridor, weather, averageDetails, chargers] = await Promise.all([
    loadCorridorPlaces({
      line: chosenLine,
      extraTypes: [...scenicTypes(prefs), ...childAmenityTypes(prefs)],
    }),
    weatherAlongRoute({
      line: chosenLine,
      departAt: input.departAt,
      durationMin: chosenRoute.duration_min,
      distanceKm: roadKm,
    }),
    bulletinFuel
      ? readLatestAverageDetails(countries, bulletinFuel)
      : Promise.resolve(
          new Map<
            string,
            { price: number; week: string; source: "ec-oil-bulletin" }
          >()
        ),
    input.vehicle.energy === "charge"
      ? chargersAlong(chosenLine, geometryKm)
      : Promise.resolve([] as CorridorPlace[]),
  ]);

  const places = dedupeChargers([...corridor.places, ...chargers], chosenLine);
  const [flagRows, reportRows, officialPrices] = await Promise.all([
    safeFlags(places.map((place) => place.id)),
    safeReports(
      places.filter((place) => place.kind === "fuel").map((place) => place.id),
      bulletinFuel,
      now
    ),
    officialPricesFor(places, bulletinFuel, now),
  ]);
  const flags = aggregateFlags(flagRows, now);
  const reports = newestReport(reportRows);

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
    breakEveryMin: effectiveBreakEveryMin(prefs),
    mergeWithinMin: 30,
    overnightAfterMin: day.overnight
      ? day.overnightAfterMin
      : chosenRoute.duration_min + 1,
    overnightAtMin: day.overnightAtMin,
    fuelStops,
  });

  const annotated = annotatePlaces(chosenLine, roadKm, places).map((place) =>
    applyPrice(place, officialPrices, reports, flags.get(place.id)?.weights)
  );
  const { attachments, sights } = attachStops({
    merged,
    places: annotated,
    preferences: prefs,
    vehicle: input.vehicle,
    driveMin: chosenRoute.duration_min,
    distanceKm: roadKm,
    countryAt: (lat, lng) => countryCodeAtPoint(lng, lat),
    averagePerLitre: (country) => averageDetails.get(country)?.price ?? null,
  });

  const warnings: string[] = [];
  if (!corridor.ok) {
    warnings.push(
      "Част от станциите и хотелите не се заредиха. Липсващите спирки са ориентири по пътя."
    );
  }
  if (
    chosenRoute.provider === "osrm" &&
    (prefs.avoid_motorways || prefs.avoid_tolls)
  ) {
    warnings.push(
      "Избягването на магистрали или тол важи при Valhalla. Този маршрут е от публичния OSRM."
    );
  }
  if (prefs.pace === "scenic" && sights.length === 0) {
    warnings.push("Няма забележителности по трасето за по-спокойния ход.");
  }

  const tolls = getRouteTolls({
    geometry: chosenRoute.geometry,
    origin: { coords: input.origin.coords },
    destination: { coords: input.destination.coords },
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
    sights,
    community,
    warnings,
    preferences: prefs,
    checklist: buildChecklist({
      countries,
      departAt: input.departAt,
      withPet: prefs.with_pet,
      withChildren: prefs.with_children,
      childrenAges: prefs.children_ages,
      tolls,
    }),
    weather,
    fuelAverages: fuelAveragesForCountries({
      countries,
      fuel: input.vehicle.fuel_type,
      known: averageDetails,
    }),
    countryAt: (lng, lat) => countryCodeAtPoint(lng, lat),
    averageFor: (country) => {
      const row = averageDetails.get(country);
      return row ? { price: row.price, week: row.week } : null;
    },
    why: whyThisRoute({
      borders: borders.map((border) => ({
        chosen: border.chosen,
        nameBg: border.nameBg,
        totalMin: border.totalMin,
        waitMinutes: border.wait.minutes,
        driveMin: border.driveMin,
        distanceKm: border.distanceKm,
      })),
      directDurationMin: direct.duration_min,
      directDistanceKm: direct.distance_km,
      chosenDurationMin: chosenRoute.duration_min,
      chosenDistanceKm: roadKm,
      incidents: community.notes.map((note) => ({
        title: note.title,
        penaltyMin: note.penalty_min,
      })),
      preferences: prefs,
    }),
  });
}

function applyPrice(
  place: AnnotatedPlace,
  official: Map<string, KnownPrice>,
  reports: Map<string, { amount: number; at: string }>,
  flagWeights: Record<string, number> | undefined
): AnnotatedPlace {
  const report = reports.get(place.id);
  if (report) {
    return {
      ...place,
      flagWeights,
      priceAmount: report.amount,
      priceBasis: "community",
      priceSource: "community",
      observedAt: report.at,
    };
  }
  const known = official.get(place.id);
  if (known) {
    return {
      ...place,
      flagWeights,
      priceAmount: known.amount,
      priceBasis: "official",
      priceSource: known.source,
      observedAt: known.observedAt,
    };
  }
  return { ...place, flagWeights };
}

async function officialPricesFor(
  places: CorridorPlace[],
  fuel: "petrol" | "diesel" | null,
  now: Date
): Promise<Map<string, KnownPrice>> {
  const found = new Map<string, KnownPrice>();
  if (!fuel) return found;
  const candidates = places
    .filter((place) => place.kind === "fuel")
    .filter((place) => {
      const country = countryCodeAtPoint(place.lng, place.lat);
      return country === "AT" || country === "DE";
    })
    .slice(0, PRICE_LOOKUPS);
  const looked = await Promise.all(
    candidates.map(async (place) => {
      const country = countryCodeAtPoint(place.lng, place.lat);
      const result = await resolveStationPrice(
        { countryCode: country, fuel, lat: place.lat, lng: place.lng },
        { now }
      );
      return result.price ? ([place.id, result.price] as const) : null;
    })
  );
  for (const row of looked) {
    if (row) found.set(row[0], row[1]);
  }
  return found;
}

async function chargersAlong(
  line: Array<[number, number]>,
  geometryKm: number
): Promise<CorridorPlace[]> {
  const samples = [0.3, 0.7].map((fraction) =>
    pointAtDistance(line, geometryKm * fraction)
  );
  const batches = await Promise.all(
    samples.map(async (point) => {
      try {
        return await getEVStations(point.lng, point.lat, 20);
      } catch {
        return [];
      }
    })
  );
  return batches.flat().map((station) => ({
    id: station.id.startsWith("ocm-") ? station.id : `ocm-${station.id}`,
    name: station.name,
    brand: station.operator || null,
    lat: station.coords.lat,
    lng: station.coords.lng,
    kind: "charging" as const,
    motorwayService: false,
    tags: {},
    alongM: null,
    distM: null,
    source: "openchargemap" as const,
  }));
}

function dedupeChargers(
  places: CorridorPlace[],
  line: Array<[number, number]>
): CorridorPlace[] {
  const kept: CorridorPlace[] = [];
  for (const place of places) {
    if (place.kind !== "charging" || place.source !== "openchargemap") {
      kept.push(place);
      continue;
    }
    const nearOsm = places.some(
      (other) =>
        other.source !== "openchargemap" &&
        other.kind === "charging" &&
        haversineKm(
          { lng: place.lng, lat: place.lat },
          { lng: other.lng, lat: other.lat }
        ) < 0.15
    );
    if (
      !nearOsm &&
      distanceToPolylineKm(line, { lng: place.lng, lat: place.lat })
        .distanceKm <= 8
    ) {
      kept.push(place);
    }
  }
  return kept;
}

function newestReport(
  rows: Array<{ station_id: string; price: number; reported_at: string }>
): Map<string, { amount: number; at: string }> {
  const map = new Map<string, { amount: number; at: string }>();
  for (const row of rows) {
    const current = map.get(row.station_id);
    if (!current || row.reported_at > current.at) {
      map.set(row.station_id, { amount: row.price, at: row.reported_at });
    }
  }
  return map;
}

async function safeFlags(placeIds: string[]) {
  if (!isDatabaseConfigured() || placeIds.length === 0) return [];
  try {
    return await listPlaceFlags(placeIds);
  } catch {
    return [];
  }
}

async function safeReports(
  stationIds: string[],
  fuel: "petrol" | "diesel" | null,
  now: Date
) {
  if (!isDatabaseConfigured() || !fuel || stationIds.length === 0) return [];
  try {
    return await listValidFuelReports(stationIds, fuel, now);
  } catch {
    return [];
  }
}

async function borderTraffic(
  candidates: Array<{ id: string; coords: GeoPoint }>
): Promise<Map<string, number | null>> {
  const apiKey = process.env.TOMTOM_API_KEY?.trim();
  const targets = candidates.filter(
    (candidate) => !isCrossingLicensed(candidate.id)
  );
  if (!apiKey || targets.length === 0) return new Map();
  const rows = await Promise.all(
    targets.map(async (candidate) => {
      const delay = await trafficDelayNearBorder({
        coords: candidate.coords,
        apiKey,
      });
      return [candidate.id, delay] as const;
    })
  );
  return new Map(rows);
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
