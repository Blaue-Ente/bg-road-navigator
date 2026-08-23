/**
 * Turn a calculated route into a human briefing:
 * how long, what can go wrong, what to do before leaving.
 */

import {
  findNearestCity,
  getCityById,
  getHomeCity,
  type EuropeanCity,
} from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { getAllEuropeanCrossings } from "@/lib/constants/european-borders";
import {
  selectTipsForRoute,
  type TravelTip,
  type VehicleType,
} from "@/lib/constants/travel-tips";
import {
  vignettesForCountryCodes,
  type VignetteLink,
} from "@/lib/constants/vignettes";
import { formatDuration, haversineKm } from "@/lib/utils/route-planner";
import type { GeoPoint, Route, RoutePoint } from "@/types/route.types";

const CITY_MATCH_KM = 55;
const BORDER_NEAR_ROUTE_KM = 70;
const ALREADY_HOME_KM = 35;
const GEOMETRY_SAMPLE_STEP = 12;

export interface HomeChecklistItem {
  id: string;
  title: string;
  detail: string;
  href?: string;
  priority: "high" | "medium";
}

export interface HomeBriefing {
  heading: string;
  summary: string;
  isGoingHome: boolean;
  alreadyHome: boolean;
  countryCodes: string[];
  matchedCorridorId: string | null;
  borderIds: string[];
  vignettes: VignetteLink[];
  checklist: HomeChecklistItem[];
  tips: TravelTip[];
  departureAdvice: string | null;
  nextAction: string;
}

export interface HomeBriefingOptions {
  homeCityId?: string | null;
  now?: Date;
  /** Override local hour (0–23) for deterministic tests. */
  hour?: number;
  weekday?: number;
  vehicleType?: VehicleType;
}

export function cityToRoutePoint(city: EuropeanCity): RoutePoint {
  return {
    id: city.id,
    label: city.label,
    subtitle: city.country,
    coords: city.coords,
    source: "curated",
  };
}

export function homeCityToRoutePoint(cityId?: string | null): RoutePoint {
  return cityToRoutePoint(getHomeCity(cityId));
}

export function findCityForPoint(
  point: { id?: string; label?: string; coords: GeoPoint },
  maxKm = CITY_MATCH_KM
): EuropeanCity | null {
  if (point.id) {
    const byId = getCityById(point.id);
    if (byId) return byId;
  }
  if (point.label) {
    const byLabel = getCityById(
      // curated ids are lowercase english; labels are Bulgarian
      point.id ?? ""
    );
    if (byLabel) return byLabel;
  }
  return findNearestCity(point.coords, maxKm);
}

export function matchCorridor(route: Route) {
  if (route.corridor_id) {
    return TRAVEL_CORRIDORS.find((c) => c.id === route.corridor_id) ?? null;
  }

  const origin = findCityForPoint(route.origin);
  const destination = findCityForPoint(route.destination);
  if (!origin || !destination) return null;

  return (
    TRAVEL_CORRIDORS.find((corridor) => {
      const first = corridor.cityIds[0];
      const last = corridor.cityIds[corridor.cityIds.length - 1];
      return first === origin.id && last === destination.id;
    }) ?? null
  );
}

export function inferCountriesAlongRoute(route: Route): string[] {
  const codes = new Set<string>();
  const corridor = matchCorridor(route);

  if (corridor) {
    for (const cityId of corridor.cityIds) {
      const city = getCityById(cityId);
      if (city) codes.add(city.countryCode);
    }
  }

  const namedPoints = [route.origin, ...route.waypoints, route.destination];
  for (const point of namedPoints) {
    const city = findCityForPoint(point);
    if (city) codes.add(city.countryCode);
  }

  const coordinates = route.geometry.coordinates;
  for (let i = 0; i < coordinates.length; i += GEOMETRY_SAMPLE_STEP) {
    const pair = coordinates[i];
    if (!pair) continue;
    const nearby = findNearestCity({ lng: pair[0], lat: pair[1] }, 90);
    if (nearby) codes.add(nearby.countryCode);
  }

  return [...codes];
}

export function inferBorderIds(route: Route): string[] {
  const corridor = matchCorridor(route);
  if (corridor?.borderIds.length) return [...corridor.borderIds];

  const countries = new Set(inferCountriesAlongRoute(route));
  const samples = sampleRoutePoints(route);
  const nearby: { id: string; km: number }[] = [];

  for (const crossing of getAllEuropeanCrossings()) {
    const [left, right] = crossing.country_pair
      .split(/[-–—]/)
      .map((part) => part.trim().toUpperCase());
    const pairTouchesRoute =
      (left && countries.has(left)) || (right && countries.has(right));
    if (!pairTouchesRoute) continue;

    const km = minDistanceToSamples(crossing.coords, samples);
    if (km <= BORDER_NEAR_ROUTE_KM) {
      nearby.push({ id: crossing.id, km });
    }
  }

  return nearby.sort((a, b) => a.km - b.km).map((item) => item.id);
}

export function isAlreadyHome(
  origin: GeoPoint,
  homeCityId?: string | null
): boolean {
  const home = getHomeCity(homeCityId);
  return haversineKm(origin, home.coords) <= ALREADY_HOME_KM;
}

export function buildHomeBriefing(
  route: Route,
  options: HomeBriefingOptions = {}
): HomeBriefing {
  const now = options.now ?? new Date();
  const hour = options.hour ?? now.getHours();
  const weekday = options.weekday ?? now.getDay();
  const month = now.getMonth() + 1;
  const home = getHomeCity(options.homeCityId);
  const destCity = findCityForPoint(route.destination);
  const isGoingHome = destCity?.id === home.id || destCity?.countryCode === "BG";
  const alreadyHome = isAlreadyHome(route.origin.coords, options.homeCityId);
  const corridor = matchCorridor(route);
  const countryCodes = inferCountriesAlongRoute(route);
  const borderIds = inferBorderIds(route);
  const vignettes = vignettesForCountryCodes(countryCodes);
  const tips = selectTipsForRoute(
    {
      countryCodes,
      durationMin: route.duration_min,
      month,
      vehicleType: options.vehicleType,
      hasBorders: borderIds.length > 0,
    },
    5
  );

  const heading = isGoingHome
    ? `Път към ${route.destination.label}`
    : `${route.origin.label} → ${route.destination.label}`;

  const parts = [
    formatDuration(route.duration_min).replace(/^~/, "Около "),
    `${route.distance_km} км`,
  ];
  if (borderIds.length > 0) {
    parts.push(
      borderIds.length === 1
        ? "1 граница"
        : `${borderIds.length} граници`
    );
  }
  if (vignettes.length > 0) {
    parts.push(
      vignettes.length === 1
        ? "1 винетка"
        : `${vignettes.length} винетки`
    );
  }

  const departureAdvice = buildDepartureAdvice({
    durationMin: route.duration_min,
    borderIds,
    countryCodes,
    hour,
    weekday,
  });

  const checklist = buildChecklist({
    route,
    borderIds,
    vignettes,
    countryCodes,
    month,
    vehicleType: options.vehicleType,
    corridorId: corridor?.id ?? null,
  });

  const nextAction = alreadyHome
    ? "Вече сте близо до вкъщи — проверете само локалния трафик."
    : departureAdvice
      ? departureAdvice
      : "Отворете маршрута в Google Maps и тръгнете, когато сте готови.";

  return {
    heading,
    summary: parts.join(" · "),
    isGoingHome,
    alreadyHome,
    countryCodes,
    matchedCorridorId: corridor?.id ?? null,
    borderIds,
    vignettes,
    checklist,
    tips,
    departureAdvice,
    nextAction,
  };
}

function sampleRoutePoints(route: Route): GeoPoint[] {
  const points: GeoPoint[] = [
    route.origin.coords,
    ...route.waypoints.map((w) => w.coords),
    route.destination.coords,
  ];
  const coordinates = route.geometry.coordinates;
  for (let i = 0; i < coordinates.length; i += GEOMETRY_SAMPLE_STEP) {
    const pair = coordinates[i];
    if (pair) points.push({ lng: pair[0], lat: pair[1] });
  }
  return points;
}

function minDistanceToSamples(point: GeoPoint, samples: GeoPoint[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const sample of samples) {
    const km = haversineKm(point, sample);
    if (km < min) min = km;
  }
  return min;
}

function buildDepartureAdvice(input: {
  durationMin: number;
  borderIds: string[];
  countryCodes: string[];
  hour: number;
  weekday: number;
}): string | null {
  const busyBorders = input.borderIds.filter((id) =>
    [
      "kalotina",
      "kapitan-andreevo",
      "horgos",
      "calais",
      "batrovci",
    ].includes(id)
  );
  const peakHour = input.hour >= 10 && input.hour <= 18;
  const weekend = input.weekday === 0 || input.weekday === 5 || input.weekday === 6;

  if (input.countryCodes.includes("GB")) {
    return "Резервирайте Eurotunnel или парома преди да тръгнете — без билет губите половин ден.";
  }

  if (busyBorders.length > 0 && peakHour) {
    return weekend
      ? "Сега е пиков уикенд на границите. Ако можете, тръгнете след 20 ч или преди 6 ч сутринта."
      : "Сега е пиков час на границите. По-бързо е след 20 ч или преди 7 ч сутринта.";
  }

  if (busyBorders.length > 0) {
    return "Минете Калотина / Хоргош рано сутрин или късно вечер — обедните опашки ядат 1–2 часа.";
  }

  if (input.durationMin >= 12 * 60) {
    return "Тръгнете в 5–6 ч сутринта. Така минавате повечето граници преди обед и спирате за сън преди умората.";
  }

  if (input.durationMin >= 6 * 60) {
    return "Тръгнете преди 8 ч, за да пристигнете на светло и да избегнете вечерния трафик.";
  }

  return null;
}

function buildChecklist(input: {
  route: Route;
  borderIds: string[];
  vignettes: VignetteLink[];
  countryCodes: string[];
  month: number;
  vehicleType?: VehicleType;
  corridorId: string | null;
}): HomeChecklistItem[] {
  const items: HomeChecklistItem[] = [
    {
      id: "docs",
      title: "Документи",
      detail: "Лична карта/паспорт, книжка, талон, зелена карта.",
      href: "/emergency",
      priority: "high",
    },
  ];

  if (input.vignettes.length > 0) {
    items.push({
      id: "vignettes",
      title: "Винетки",
      detail: `Купете преди тръгване: ${input.vignettes
        .map((v) => v.country_code)
        .join(", ")}.`,
      href: "/vignettes",
      priority: "high",
    });
  }

  if (input.borderIds.length > 0) {
    const query = new URLSearchParams({ route: "1" });
    query.set("border_ids", input.borderIds.join(","));
    items.push({
      id: "borders",
      title: "Опашки на границите",
      detail: "Проверете live чакането и алтернативен пролаз преди да тръгнете.",
      href: `/borders?${query.toString()}`,
      priority: "high",
    });
  }

  if (input.route.duration_min >= 180) {
    items.push({
      id: "fuel",
      title: input.vehicleType === "ev" ? "Заряд по пътя" : "Гориво по пътя",
      detail:
        input.vehicleType === "ev"
          ? "Потвърдете зарядните преди да тръгнете — особено преди граница."
          : "Пълен бак преди граница. Изберете станция 20–30 км по-рано.",
      href: "/fuel?route=1",
      priority: "medium",
    });
  }

  if (input.route.duration_min >= 600) {
    const hotelsHref = input.corridorId
      ? `/hotels?corridor=${input.corridorId}`
      : "/hotels";
    items.push({
      id: "sleep",
      title: "Нощувка",
      detail: "Резервирайте легло преди да тръгнете — не търсете в полунощ.",
      href: hotelsHref,
      priority: "high",
    });
  }

  const winterMonths = [11, 12, 1, 2, 3, 4];
  const winterCountries = input.countryCodes.some((code) =>
    ["AT", "DE", "CH", "CZ", "SK", "SE", "NO", "DK"].includes(code)
  );
  if (winterMonths.includes(input.month) && winterCountries) {
    items.push({
      id: "winter",
      title: "Зимни гуми",
      detail: "Задължителни в част от държавите по пътя до края на март/април.",
      href: "/tips",
      priority: "high",
    });
  }

  items.push({
    id: "weather",
    title: "Времето по пътя",
    detail: "Вижте дъжд, сняг и вятър по етапите преди да тръгнете.",
    href: "/weather",
    priority: "medium",
  });

  return items;
}
