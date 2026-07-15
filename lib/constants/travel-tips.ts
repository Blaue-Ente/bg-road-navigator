/**
 * Travel tips for long European road trips (30+ hours)
 */

export interface TravelTip {
  id: string;
  category: "safety" | "borders" | "fuel" | "rest" | "weather" | "documents" | "ev";
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
}

export const LONG_HAUL_TIPS: TravelTip[] = [
  {
    id: "rest-every-4h",
    category: "rest",
    title: "Почивка на всеки 3–4 часа",
    body: "При пътуване над 30 часа планирайте минимум 2 нощувки или смени на водач. Спирайте на всеки 250–300 км за разтягане и кафе.",
    priority: "high",
  },
  {
    id: "border-timing",
    category: "borders",
    title: "Граници извън пиковите часове",
    body: "Кале, Хоргош и Капитан Андреево са най-натоварени 10–18 ч. Планирайте преминаване рано сутрин или късно вечер.",
    priority: "high",
  },
  {
    id: "vignettes",
    category: "documents",
    title: "Винетки и пътни такси",
    body: "Проверете винетки за AT, HU, CH, SI, CZ и електронни тол системи (HU, PL). Запазете касови бележки.",
    priority: "high",
  },
  {
    id: "fuel-plan",
    category: "fuel",
    title: "Гориво по маршрута",
    body: "На дълги маршрути зареждайте при пълни бакове преди граници и в големи градове. Дизелът варира значително между държавите.",
    priority: "medium",
  },
  {
    id: "ev-charging",
    category: "ev",
    title: "EV — планирайте зарядни",
    body: "При електромобил резервирайте зарядни на магистралите (Ionity, Fastned, Tesla). Зимата намалете очаквания пробег с 20–30%.",
    priority: "high",
  },
  {
    id: "winter-gear",
    category: "weather",
    title: "Зимна екипировка",
    body: "Австрия, Германия и Скандинавия изискват зимни гуми (ноември–април). Вземете одеяло, вода и ледорез.",
    priority: "medium",
  },
  {
    id: "cash-cards",
    category: "documents",
    title: "Кеш и карти",
    body: "На някои граници и мотели в Балканите предпочитат кеш. Имайте EUR в брой и активирана карта за чужбина.",
    priority: "medium",
  },
  {
    id: "ferry-calais",
    category: "borders",
    title: "Кале / Eurotunnel",
    body: "За UK маршрути резервирайте Eurotunnel или паром предварително. Проверете паспортните изисквания след Brexit.",
    priority: "high",
  },
  {
    id: "night-driving",
    category: "safety",
    title: "Нощно шофиране",
    body: "Избягвайте нощно шофиране в непознати планински участъци (Родопи, Алпи, Карпати). Предпочитайте дневни часове.",
    priority: "high",
  },
  {
    id: "emergency-kit",
    category: "safety",
    title: "Аварийен комплект",
    body: "Задължителни в много държави: жълт триъгълник, жилетка, аптечка, запалка/фенер. Проверете националните изисквания.",
    priority: "medium",
  },
  {
    id: "community-updates",
    category: "safety",
    title: "Живи сигнали от общността",
    body: "Проверете секцията Общност за актуални КAT, катастрофи и пътни ремонти по вашия коридор.",
    priority: "low",
  },
  {
    id: "hotel-booking",
    category: "rest",
    title: "Резервирайте нощувки",
    body: "При 30+ часа пътуване резервирайте хотели по маршрута (Виена, Будапеща, Белград). Лятото местата се пълнят бързо.",
    priority: "high",
  },
];

export const CATEGORY_LABELS: Record<TravelTip["category"], string> = {
  safety: "Безопасност",
  borders: "Граници",
  fuel: "Гориво",
  rest: "Почивка",
  weather: "Време",
  documents: "Документи",
  ev: "Електромобили",
};

export function getTipsForLongHaul(): TravelTip[] {
  return LONG_HAUL_TIPS.filter((t) => t.priority === "high");
}

export function getTipsByCategory(category: TravelTip["category"]): TravelTip[] {
  return LONG_HAUL_TIPS.filter((t) => t.category === category);
}
