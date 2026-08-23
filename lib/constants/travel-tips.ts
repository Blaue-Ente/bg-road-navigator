/**
 * Travel tips for European road trips home — filtered by route context.
 */

export type VehicleType = "car" | "ev" | "truck" | "motorcycle";

export interface TravelTip {
  id: string;
  category: "safety" | "borders" | "fuel" | "rest" | "weather" | "documents" | "ev";
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
  /** Relevant if the route includes any of these ISO country codes. */
  countries?: string[];
  minDurationMin?: number;
  /** Calendar months 1–12 when the tip applies (e.g. winter tyres). */
  months?: number[];
  vehicleTypes?: VehicleType[];
  requiresBorders?: boolean;
}

export interface TipContext {
  countryCodes: string[];
  durationMin: number;
  month: number;
  vehicleType?: VehicleType;
  hasBorders?: boolean;
}

export const LONG_HAUL_TIPS: TravelTip[] = [
  {
    id: "documents-ready",
    category: "documents",
    title: "Документи на ръка преди тръгване",
    body: "Лична карта или паспорт, шофьорска книжка, талон и зелена карта. Сложете ги на едно място — на границата няма време за търсене.",
    priority: "high",
    minDurationMin: 90,
  },
  {
    id: "rest-every-4h",
    category: "rest",
    title: "Почивка на всеки 3–4 часа",
    body: "Спирайте на всеки 250–300 км за вода, разтягане и кафе. Над 10 часа шофиране планирайте нощувка или смяна на водач — умората е по-опасна от опашката.",
    priority: "high",
    minDurationMin: 240,
  },
  {
    id: "border-timing",
    category: "borders",
    title: "Граници извън пиковите часове",
    body: "Калотина, Хоргош и Капитан Андреево се натрупват 10–18 ч, особено петък и неделя. Минете ги рано сутрин или късно вечер.",
    priority: "high",
    requiresBorders: true,
  },
  {
    id: "vignettes",
    category: "documents",
    title: "Купете винетка преди границата",
    body: "Камерите глобяват веднага. Купувайте само от официални портали (BGTOLL, ASFINAG, e-matrica, DARS, edalnice) преди да влезете в държавата.",
    priority: "high",
    countries: ["BG", "AT", "HU", "CH", "SI", "CZ", "SK", "RO"],
  },
  {
    id: "fuel-plan",
    category: "fuel",
    title: "Пълен бак преди граница и планини",
    body: "Заредете преди Калотина, Хоргош и планински участъци. Цените скачат на самата граница — по-евтино е 20–30 км по-рано.",
    priority: "medium",
    minDurationMin: 180,
  },
  {
    id: "ev-charging",
    category: "ev",
    title: "EV — потвърдете зарядните",
    body: "Резервирайте Ionity / Fastned / Tesla по магистралата. Зимата намалете пробега с 20–30% и не разчитайте на последната станция преди граница.",
    priority: "high",
    vehicleTypes: ["ev"],
  },
  {
    id: "winter-gear",
    category: "weather",
    title: "Зимни гуми и одеяло",
    body: "Австрия, Германия, Чехия и Скандинавия изискват зимни гуми (ноември–април). Носете одеяло, вода и стъргалка — нощната температура пада бързо.",
    priority: "high",
    months: [11, 12, 1, 2, 3, 4],
    countries: ["AT", "DE", "CH", "CZ", "SK", "SE", "NO", "DK"],
  },
  {
    id: "cash-cards",
    category: "documents",
    title: "Евро в брой за Балканите",
    body: "На някои граници, мотели и малки бензиностанции в Сърбия и Северна Македония все още искат кеш. Дръжте 50–100 EUR и карта за чужбина.",
    priority: "medium",
    countries: ["RS", "MK", "AL", "TR", "BA"],
  },
  {
    id: "ferry-calais",
    category: "borders",
    title: "Кале / Eurotunnel — резервирайте сега",
    body: "Без предварителна резервация губите часове. Нужен е паспорт (Brexit). Проверете билета и опашката преди да тръгнете към терминала.",
    priority: "high",
    countries: ["GB"],
  },
  {
    id: "night-driving",
    category: "safety",
    title: "Не карайте цяла нощ сами",
    body: "След 22 ч реакцията пада рязко. Ако сте сами, спрете за сън преди полунощ — особено в Алпите, Карпатите и непознати обходни пътища.",
    priority: "high",
    minDurationMin: 480,
  },
  {
    id: "emergency-kit",
    category: "safety",
    title: "Жилетка, триъгълник, аптечка",
    body: "Задължителни в повечето държави по пътя. Сложете жилетката преди да излезете от колата — глобата е по-скъпа от комплекта.",
    priority: "medium",
    minDurationMin: 60,
  },
  {
    id: "community-updates",
    category: "safety",
    title: "Живи сигнали от общността",
    body: "Преди тръгване погледнете Общност за КАТ, катастрофи и ремонти по коридора — често са по-свежи от официалния трафик.",
    priority: "low",
  },
  {
    id: "hotel-booking",
    category: "rest",
    title: "Резервирайте нощувка преди да тръгнете",
    body: "Над 10 часа път си запазете легло около Виена, Будапеща или Белград. Лятото и петък вечер местата по магистралата свършват.",
    priority: "high",
    minDurationMin: 600,
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

const PRIORITY_RANK: Record<TravelTip["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function isTipRelevant(tip: TravelTip, ctx: TipContext): boolean {
  if (tip.minDurationMin !== undefined && ctx.durationMin < tip.minDurationMin) {
    return false;
  }
  if (tip.requiresBorders && !ctx.hasBorders) {
    return false;
  }
  if (tip.countries?.length) {
    const codes = new Set(ctx.countryCodes);
    if (!tip.countries.some((code) => codes.has(code))) return false;
  }
  if (tip.months?.length && !tip.months.includes(ctx.month)) {
    return false;
  }
  if (tip.vehicleTypes?.length) {
    if (!ctx.vehicleType || !tip.vehicleTypes.includes(ctx.vehicleType)) {
      return false;
    }
  }
  return true;
}

/** Highest-priority tips that actually apply to this trip. */
export function selectTipsForRoute(ctx: TipContext, limit = 5): TravelTip[] {
  return LONG_HAUL_TIPS.filter((tip) => isTipRelevant(tip, ctx))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, limit);
}
