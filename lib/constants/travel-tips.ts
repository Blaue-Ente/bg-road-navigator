/**
 * Travel tips for long European road trips (30+ hours)
 */

import type { Locale } from "@/lib/i18n/locale";
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";

export interface TravelTip {
  id: string;
  category:
    | "safety"
    | "borders"
    | "fuel"
    | "rest"
    | "weather"
    | "documents"
    | "ev";
  title: Localized;
  body: Localized;
  priority: "high" | "medium" | "low";
}

export const LONG_HAUL_TIPS: TravelTip[] = [
  {
    id: "rest-every-4h",
    category: "rest",
    title: {
      bg: "Почивка на около 2 часа и 15 минути",
      en: "Break about every 2 hours 15 minutes",
      tr: "Yaklaşık her 2 saat 15 dakikada bir mola",
      ro: "Pauză la aproximativ 2 ore și 15 minute",
    },
    body: {
      bg: "Планът спира през този интервал. На път над 30 часа заложете и нощувка или втори водач.",
      en: "The plan stops on this interval. On a trip over 30 hours, also plan an overnight stay or a second driver.",
      tr: "Plan bu aralıkta durur. 30 saati aşan yollarda geceleme veya ikinci sürücü de ayarlayın.",
      ro: "Planul prevede opriri la acest interval. La peste 30 de ore de condus, includeți și o noapte de cazare sau un al doilea șofer.",
    },
    priority: "high",
  },
  {
    id: "border-timing",
    category: "borders",
    title: {
      bg: "Граници извън пиковите часове",
      en: "Borders outside peak hours",
      tr: "Sınır geçişleri yoğun saatlerin dışında",
      ro: "Vămile în afara orelor de vârf",
    },
    body: {
      bg: "Кале, Хоргош и Капитан Андреево са най-натоварени 10–18 ч. Планирайте преминаване рано сутрин или късно вечер.",
      en: "Calais, Horgoš and Kapitan Andreevo are busiest between 10:00 and 18:00. Plan to cross early in the morning or late in the evening.",
      tr: "Calais, Horgoš ve Kapitan Andreevo en yoğun 10–18 saatleri arasında. Geçişi sabah erken veya akşam geç planlayın.",
      ro: "Calais, Horgoš și Kapitan Andreevo sunt cele mai aglomerate între 10:00 și 18:00. Planificați trecerea dimineața devreme sau seara târziu.",
    },
    priority: "high",
  },
  {
    id: "vignettes",
    category: "documents",
    title: {
      bg: "Винетки и пътни такси",
      en: "Vignettes and road charges",
      tr: "Vinyetler ve yol ücretleri",
      ro: "Roviete și taxe rutiere",
    },
    body: {
      bg: "Купувайте само от официални портали. Пълният списък е в раздела Винетки.",
      en: "Buy only from official portals. The full list is in the Vignettes section.",
      tr: "Yalnızca resmî portallardan satın alın. Tam liste Vinyetler bölümündedir.",
      ro: "Cumpărați doar de pe portalurile oficiale. Lista completă este în secțiunea Roviete.",
    },
    priority: "high",
  },
  {
    id: "fuel-plan",
    category: "fuel",
    title: {
      bg: "Гориво по маршрута",
      en: "Fuel along the route",
      tr: "Güzergâh boyunca yakıt",
      ro: "Combustibil pe traseu",
    },
    body: {
      bg: "На дълги маршрути зареждайте при пълни бакове преди граници и в големи градове. Дизелът варира значително между държавите.",
      en: "On long routes, fill up before borders and in major cities. Diesel prices vary significantly between countries.",
      tr: "Uzun güzergâhlarda sınırlardan önce ve büyük şehirlerde depoyu doldurun. Motorin ülkeler arasında belirgin şekilde değişir.",
      ro: "Pe trasee lungi, alimentați înainte de granițe și în orașe mari. Motorina variază mult de la o țară la alta.",
    },
    priority: "medium",
  },
  {
    id: "ev-charging",
    category: "ev",
    title: {
      bg: "EV — планирайте зарядни",
      en: "EV — plan charging stops",
      tr: "Elektrikli araç — şarj planı yapın",
      ro: "Mașină electrică — planificați încărcările",
    },
    body: {
      bg: "При електромобил резервирайте зарядни на магистралите (Ionity, Fastned, Tesla). Зимата намалете очаквания пробег с 20–30%.",
      en: "In an EV, book chargers on motorways (Ionity, Fastned, Tesla). In winter, cut your expected range by 20–30%.",
      tr: "Elektrikli araçta otoyollarda şarj (Ionity, Fastned, Tesla) ayırın. Kışın beklenen menzili %20–30 azaltın.",
      ro: "Cu mașina electrică, rezervați încărcări pe autostrăzi (Ionity, Fastned, Tesla). Iarna reduceți autonomia estimată cu 20–30%.",
    },
    priority: "high",
  },
  {
    id: "winter-gear",
    category: "weather",
    title: {
      bg: "Зимна екипировка",
      en: "Winter equipment",
      tr: "Kış donanımı",
      ro: "Echipament de iarnă",
    },
    body: {
      bg: "Австрия, Германия и Скандинавия изискват зимни гуми (ноември–април). Вземете одеяло, вода и ледорез.",
      en: "Austria, Germany and Scandinavia require winter tyres (November–April). Pack a blanket, water and an ice scraper.",
      tr: "Avusturya, Almanya ve İskandinavya kış lastiği ister (Kasım–Nisan). Battaniye, su ve buz kazıyıcı alın.",
      ro: "Austria, Germania și Scandinavia cer anvelope de iarnă (noiembrie–aprilie). Luați pătură, apă și racletă de gheață.",
    },
    priority: "medium",
  },
  {
    id: "cash-cards",
    category: "documents",
    title: {
      bg: "Кеш и карти",
      en: "Cash and cards",
      tr: "Nakit ve kartlar",
      ro: "Numerar și carduri",
    },
    body: {
      bg: "На някои граници и мотели в Балканите предпочитат кеш. Имайте EUR в брой и активирана карта за чужбина.",
      en: "Some Balkan borders and motels prefer cash. Carry EUR in cash and a card enabled for use abroad.",
      tr: "Balkanlarda bazı sınırlar ve moteller nakit tercih eder. Yanınızda EUR nakit ve yurtdışına açık kart olsun.",
      ro: "Unele granițe și moteluri din Balcani preferă numerarul. Aveți EUR cash și card activat pentru străinătate.",
    },
    priority: "medium",
  },
  {
    id: "ferry-calais",
    category: "borders",
    title: {
      bg: "Кале / Eurotunnel",
      en: "Calais / Eurotunnel",
      tr: "Calais / Eurotunnel",
      ro: "Calais / Eurotunnel",
    },
    body: {
      bg: "За UK маршрути резервирайте Eurotunnel или паром предварително. Проверете паспортните изисквания след Brexit.",
      en: "For UK routes, book Eurotunnel or a ferry in advance. Check passport rules after Brexit.",
      tr: "İngiltere güzergâhlarında Eurotunnel veya feribotu önceden ayırtın. Brexit sonrası pasaport kurallarını kontrol edin.",
      ro: "Pentru rute spre Marea Britanie, rezervați din timp Eurotunnel sau feribotul. Verificați cerințele de pașaport după Brexit.",
    },
    priority: "high",
  },
  {
    id: "night-driving",
    category: "safety",
    title: {
      bg: "Нощно шофиране",
      en: "Night driving",
      tr: "Gece sürüşü",
      ro: "Condus pe timp de noapte",
    },
    body: {
      bg: "Избягвайте нощно шофиране в непознати планински участъци (Родопи, Алпи, Карпати). Предпочитайте дневни часове.",
      en: "Avoid night driving on unfamiliar mountain roads (Rhodopes, Alps, Carpathians). Prefer daylight hours.",
      tr: "Tanımadığınız dağ yollarında (Rodoplar, Alpler, Karpatlar) gece sürüşünden kaçının. Gündüz saatlerini tercih edin.",
      ro: "Evitați condusul noaptea pe sectoare montane necunoscute (Rodopi, Alpi, Carpați). Preferați orele de zi.",
    },
    priority: "high",
  },
  {
    id: "emergency-kit",
    category: "safety",
    title: {
      bg: "Аварийен комплект",
      en: "Emergency kit",
      tr: "Acil durum seti",
      ro: "Kit de urgență",
    },
    body: {
      bg: "Задължителни в много държави: жълт триъгълник, жилетка, аптечка, запалка/фенер. Проверете националните изисквания.",
      en: "Required in many countries: warning triangle, hi-vis vest, first-aid kit, lighter/torch. Check national rules.",
      tr: "Birçok ülkede zorunlu: üçgen işaret, yansıtıcı yelek, ilk yardım çantası, çakmak/el feneri. Ulusal kuralları kontrol edin.",
      ro: "Obligatorii în multe țări: triunghi, vestă reflectorizantă, trusă de prim ajutor, brichetă/lanternă. Verificați cerințele naționale.",
    },
    priority: "medium",
  },
  {
    id: "community-updates",
    category: "safety",
    title: {
      bg: "Живи сигнали от общността",
      en: "Live community updates",
      tr: "Topluluktan canlı uyarılar",
      ro: "Semnale live din comunitate",
    },
    body: {
      bg: "Проверете секцията Общност за актуални КAT, катастрофи и пътни ремонти по вашия коридор.",
      en: "Check Community for current traffic jams, accidents and road works along your corridor.",
      tr: "Koridorunuz için güncel trafik, kazalar ve yol çalışmaları için Topluluk bölümüne bakın.",
      ro: "Consultați secțiunea Comunitate pentru blocaje, accidente și lucrări pe coridorul dumneavoastră.",
    },
    priority: "low",
  },
  {
    id: "hotel-booking",
    category: "rest",
    title: {
      bg: "Резервирайте нощувки",
      en: "Book overnight stays",
      tr: "Konaklama ayırtın",
      ro: "Rezervați cazări",
    },
    body: {
      bg: "При 30+ часа пътуване резервирайте хотели по маршрута (Виена, Будапеща, Белград). Лятото местата се пълнят бързо.",
      en: "On trips over 30 hours, book hotels along the route (Vienna, Budapest, Belgrade). Summer fills up fast.",
      tr: "30+ saatlik yolculukta güzergâh üzerinde otel ayırtın (Viyana, Budapeşte, Belgrad). Yazın yerler çabuk dolar.",
      ro: "La peste 30 de ore de drum, rezervați hoteluri pe traseu (Viena, Budapesta, Belgrad). Vara locurile se ocupă repede.",
    },
    priority: "high",
  },
];

export const CATEGORY_LABELS: Record<TravelTip["category"], Localized> = {
  safety: {
    bg: "Безопасност",
    en: "Safety",
    tr: "Güvenlik",
    ro: "Siguranță",
  },
  borders: {
    bg: "Граници",
    en: "Borders",
    tr: "Sınırlar",
    ro: "Granițe",
  },
  fuel: {
    bg: "Гориво",
    en: "Fuel",
    tr: "Yakıt",
    ro: "Combustibil",
  },
  rest: {
    bg: "Почивка",
    en: "Rest",
    tr: "Mola",
    ro: "Pauză",
  },
  weather: {
    bg: "Време",
    en: "Weather",
    tr: "Hava durumu",
    ro: "Vremea",
  },
  documents: {
    bg: "Документи",
    en: "Documents",
    tr: "Belgeler",
    ro: "Documente",
  },
  ev: {
    bg: "Електромобили",
    en: "Electric vehicles",
    tr: "Elektrikli araçlar",
    ro: "Vehicule electrice",
  },
};

export function tipTitle(locale: Locale, tip: TravelTip): string {
  return pickText(locale, tip.title);
}

export function tipBody(locale: Locale, tip: TravelTip): string {
  return pickText(locale, tip.body);
}

export function categoryLabel(
  locale: Locale,
  category: TravelTip["category"]
): string {
  return pickText(locale, CATEGORY_LABELS[category]);
}

export function getTipsForLongHaul(): TravelTip[] {
  return LONG_HAUL_TIPS.filter((t) => t.priority === "high");
}

export function getTipsByCategory(
  category: TravelTip["category"]
): TravelTip[] {
  return LONG_HAUL_TIPS.filter((t) => t.category === category);
}