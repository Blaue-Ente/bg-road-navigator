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
import { hazardsAlongRoute } from "@/lib/hazards/along-route";
import { loadRoadHazards } from "@/lib/hazards/datex";
import { hazardReason, hazardWarnings } from "@/lib/hazards/present";
import { hotspotsAlongRoute } from "@/lib/hotspots/along-route";
import { loadHotspots } from "@/lib/hotspots/load";
import { hotspotReason, hotspotWarnings } from "@/lib/hotspots/present";
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
  nearestHungarySerbiaCrossing,
  selectCandidateBorders,
  selectHungarySerbiaBorders,
  scoreBorderOptions,
  tripMayCrossHungarySerbia,
  type BorderCandidate,
  type BorderScoreInput,
  type ScoredBorder,
} from "@/lib/planner/borders";
import {
  mergeDrivingBreaks,
  resolveSleepShifts,
  sleepMinutesBefore,
  sleepShifts,
  type FuelTimedStop,
  type SleepShift,
} from "@/lib/planner/breaks";
import { buildChecklist } from "@/lib/planner/checklist";
import { trafficDelayNearBorder } from "@/lib/planner/border-traffic";
import { communityAlongRoute } from "@/lib/planner/community";
import { isHungarySerbiaPlannerId } from "@/lib/constants/border-official-links";
import {
  hatarinfoReading,
  hungarySerbiaDirection,
  loadHatarinfo,
  type HatarinfoSnapshot,
} from "@/lib/borders/hatarinfo";
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
  const borderEnds = {
    origin: input.origin.coords,
    destination: input.destination.coords,
    originCountry,
    destinationCountry,
  };
  const bgCandidates = selectCandidateBorders(borderEnds).filter((candidate) =>
    allowsBorder(candidate.id, prefs)
  );
  const crossesHuRs = tripMayCrossHungarySerbia(borderEnds);
  const huRsIsRouteChoice = bgCandidates.length === 0 && crossesHuRs;
  const candidates = huRsIsRouteChoice
    ? selectHungarySerbiaBorders(borderEnds).filter((candidate) =>
        allowsBorder(candidate.id, prefs)
      )
    : bgCandidates;

  const viaCoords = (input.via ?? [])
    .slice(0, MAX_VIA)
    .map((point) => point.coords);
  const [direct, viaList, pins, waits, traffic, hatarinfo] = await Promise.all([
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
    crossesHuRs ? loadHatarinfo(now.getTime()) : Promise.resolve(null),
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
        licensed: isHungarySerbiaPlannerId(candidate.id)
          ? false
          : isCrossingLicensed(candidate.id),
        trafficDelayMin: traffic.get(candidate.id) ?? null,
        hatarinfo: hatarinfoFor(
          hatarinfo,
          candidate.id,
          input.origin.coords,
          input.destination.coords
        ),
      }),
      communityPenaltyMin: community.penaltyMin,
    });
  }

  let borders: ScoredBorder[] = applyPreferredBorder(
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
  if (!huRsIsRouteChoice && crossesHuRs) {
    const attached = await serbiaHungaryOnRoute({
      line: chosenLine,
      snapshot: hatarinfo,
      origin: input.origin.coords,
      destination: input.destination.coords,
      now,
      driveMin: chosenRoute.duration_min,
      distanceKm: chosenRoute.distance_km,
    });
    if (
      attached &&
      !borders.some((border) => border.borderId === attached.borderId)
    ) {
      borders = [...borders, attached];
    }
  }
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
  const borderRoadKm =
    borderAlong == null ? null : (borderAlong / geometryKm) * roadKm;
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
  const preliminaryWait = chosen?.wait.minutes ?? 0;
  const sleepAnchor = sleepShifts({
    driveMin: chosenRoute.duration_min,
    overnight: day.overnight,
    overnightAfterMin: day.overnight
      ? day.overnightAfterMin
      : chosenRoute.duration_min + 1,
    overnightAtMin: day.overnightAtMin,
  });
  const sleepResolved = resolveSleepShifts({
    departAt: input.departAt,
    shifts: sleepAnchor,
    extraWaitMin: (drivingMin) => {
      if (borderRoadKm == null) return 0;
      const roadAt =
        (drivingMin / Math.max(chosenRoute.duration_min, 1)) * roadKm;
      return roadAt >= borderRoadKm - 1 ? preliminaryWait : 0;
    },
  });
  borders = refreshBorderWaits({
    borders,
    scoreInputs,
    chosenId: chosen?.borderId ?? null,
    departAt: input.departAt,
    borderRoadKm,
    driveMin: chosenRoute.duration_min,
    roadKm,
    sleepShifts: sleepResolved,
    now,
    hatarinfo,
    origin: input.origin.coords,
    destination: input.destination.coords,
    candidates,
    waits,
    traffic,
  });
  const chosenBorder = borders.find((border) => border.chosen) ?? null;
  const borderWaitForWeather = chosenBorder?.wait.minutes ?? 0;

  const [corridor, weather, averageDetails, chargers, hazardFeed] =
    await Promise.all([
      loadCorridorPlaces({
        line: chosenLine,
        extraTypes: [...scenicTypes(prefs), ...childAmenityTypes(prefs)],
      }),
      weatherAlongRoute({
        line: chosenLine,
        departAt: input.departAt,
        durationMin: chosenRoute.duration_min,
        distanceKm: roadKm,
        borderAlongKm: borderRoadKm,
        borderWaitMin: borderWaitForWeather,
        sleepShifts: sleepResolved,
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
      countries.includes("BG")
        ? loadRoadHazards(now.getTime())
        : Promise.resolve([]),
    ]);
  const roadHazards = hazardsAlongRoute(hazardFeed, chosenLine);
  const attentionSegments = hotspotsAlongRoute(loadHotspots(), chosenLine);

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
  warnings.push(...hazardWarnings(roadHazards));
  warnings.push(...hotspotWarnings(attentionSegments));

  const tolls = getRouteTolls({
    geometry: chosenRoute.geometry,
    origin: { coords: input.origin.coords },
    destination: { coords: input.destination.coords },
  });
  const why = whyThisRoute({
    borders: borders
      .filter((border) => border.reasonCode !== "serbia_hungary")
      .map((border) => ({
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
  });
  const hazard = hazardReason(roadHazards);
  if (hazard) why.push(hazard);
  const attention = hotspotReason(attentionSegments);
  if (attention) why.push(attention);

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
    borderAlongKm: borderRoadKm,
    sleepShifts: sleepResolved,
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
    roadHazards,
    attentionSegments,
    why,
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
    (candidate) =>
      !isCrossingLicensed(candidate.id) ||
      isHungarySerbiaPlannerId(candidate.id)
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

function refreshBorderWaits(input: {
  borders: ScoredBorder[];
  scoreInputs: BorderScoreInput[];
  chosenId: string | null;
  departAt: Date;
  borderRoadKm: number | null;
  driveMin: number;
  roadKm: number;
  sleepShifts: SleepShift[];
  now: Date;
  hatarinfo: HatarinfoSnapshot | null;
  origin: GeoPoint;
  destination: GeoPoint;
  candidates: BorderCandidate[];
  waits: Awaited<ReturnType<typeof loadWaits>>;
  traffic: Map<string, number | null>;
}): ScoredBorder[] {
  if (!input.chosenId || input.borderRoadKm == null) return input.borders;
  const candidate = input.candidates.find((row) => row.id === input.chosenId);
  if (!candidate) return input.borders;
  const borderDrivingMin =
    (input.borderRoadKm / Math.max(input.roadKm, 1)) * input.driveMin;
  const sleepBefore = sleepMinutesBefore(borderDrivingMin, input.sleepShifts);
  const eta = new Date(
    input.departAt.getTime() + (borderDrivingMin + sleepBefore) * 60_000
  );
  const cached = candidate.ppid ? input.waits.get(candidate.ppid) : undefined;
  const wait = expectedWait({
    eta,
    now: input.now,
    forecast: cached?.forecast ?? null,
    dayStats: cached?.dayStats ?? null,
    current: cached?.current ?? null,
    localTypical: candidate.localTypicalMinutes,
    licensed: isHungarySerbiaPlannerId(candidate.id)
      ? false
      : isCrossingLicensed(candidate.id),
    trafficDelayMin: input.traffic.get(candidate.id) ?? null,
    hatarinfo: hatarinfoFor(
      input.hatarinfo,
      candidate.id,
      input.origin,
      input.destination
    ),
  });
  return input.borders.map((border) =>
    border.borderId === input.chosenId
      ? {
          ...border,
          wait,
          totalMin: border.driveMin + wait.minutes + border.communityPenaltyMin,
        }
      : border
  );
}

function hatarinfoFor(
  snapshot: HatarinfoSnapshot | null,
  crossingId: string,
  origin: GeoPoint,
  destination: GeoPoint
) {
  const reading = hatarinfoReading(
    snapshot,
    crossingId,
    hungarySerbiaDirection(origin, destination)
  );
  if (!reading) return null;
  return {
    minutes: reading.minutes,
    band: reading.band,
    observedAt: reading.observedAt,
  };
}

async function serbiaHungaryOnRoute(input: {
  line: Array<[number, number]>;
  snapshot: HatarinfoSnapshot | null;
  origin: GeoPoint;
  destination: GeoPoint;
  now: Date;
  driveMin: number;
  distanceKm: number;
}): Promise<ScoredBorder | null> {
  const near = nearestHungarySerbiaCrossing(input.line);
  if (!near) return null;
  const delay = await trafficDelayNearBorder({
    coords: near.coords,
    apiKey: process.env.TOMTOM_API_KEY,
  });
  const wait = expectedWait({
    eta: input.now,
    now: input.now,
    forecast: null,
    dayStats: null,
    current: null,
    localTypical: near.localTypicalMinutes,
    licensed: false,
    trafficDelayMin: delay,
    hatarinfo: hatarinfoFor(
      input.snapshot,
      near.id,
      input.origin,
      input.destination
    ),
  });
  return {
    borderId: near.id,
    nameBg: near.nameBg,
    nameEn: near.nameEn,
    coords: near.coords,
    ppid: near.ppid,
    driveMin: input.driveMin,
    distanceKm: input.distanceKm,
    wait,
    communityPenaltyMin: 0,
    totalMin: input.driveMin + wait.minutes,
    chosen: false,
    reasonCode: "serbia_hungary",
    reason: `Маршрутът минава през ${near.nameBg}. Чакането е отделно от избора на български пункт.`,
  };
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
