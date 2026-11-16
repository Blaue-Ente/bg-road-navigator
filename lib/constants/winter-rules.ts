/**
 * Winter tyre / chain rules — curated, not live law.
 * Always labelled as guidance; check official sources before travel.
 */

import type { Locale } from "@/lib/i18n/locale";
import { countryName } from "@/lib/geo/country-name";
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";

export interface WinterRule {
  country_code: string;
  name_bg: string;
  summary: Localized;
  period: Localized;
  chains: Localized;
}

export const WINTER_RULES: WinterRule[] = [
  {
    country_code: "BG",
    name_bg: "България",
    summary: {
      bg: "Зимни гуми или гуми с дълбочина ≥ 4 мм при зимни условия.",
      en: "Winter tyres or tyres with tread depth ≥ 4 mm in winter conditions.",
      tr: "Kış koşullarında kış lastiği veya diş derinliği ≥ 4 mm olan lastik.",
      ro: "Anvelope de iarnă sau anvelope cu adâncime ≥ 4 mm în condiții de iarnă.",
    },
    period: {
      bg: "15 ноември – 1 март (практика / наредби за зимни условия)",
      en: "15 November – 1 March (practice / rules for winter conditions)",
      tr: "15 Kasım – 1 Mart (kış koşulları için uygulama / düzenlemeler)",
      ro: "15 noiembrie – 1 martie (practică / reguli pentru condiții de iarnă)",
    },
    chains: {
      bg: "Вериги в автомобила са препоръчителни в планините.",
      en: "Carry chains in the car; recommended in the mountains.",
      tr: "Zincirleri araçta bulundurmak dağlarda önerilir.",
      ro: "Lanțurile în mașină sunt recomandate la munte.",
    },
  },
  {
    country_code: "AT",
    name_bg: "Австрия",
    summary: {
      bg: "Зимни гуми задължителни при зимни условия.",
      en: "Winter tyres mandatory in winter conditions.",
      tr: "Kış koşullarında kış lastiği zorunlu.",
      ro: "Anvelope de iarnă obligatorii în condiții de iarnă.",
    },
    period: {
      bg: "1 ноември – 15 април",
      en: "1 November – 15 April",
      tr: "1 Kasım – 15 Nisan",
      ro: "1 noiembrie – 15 aprilie",
    },
    chains: {
      bg: "Вериги при съответна пътна сигнализация.",
      en: "Chains when road signs require them.",
      tr: "Yol işaretleri gerektirdiğinde zincir.",
      ro: "Lanțuri când semnalizarea rutieră o cere.",
    },
  },
  {
    country_code: "DE",
    name_bg: "Германия",
    summary: {
      bg: "Ситуационно: зимни гуми при сняг, лед, поледица (не фиксиран сезон).",
      en: "Situational: winter tyres in snow, ice or black ice (no fixed season).",
      tr: "Duruma bağlı: kar, buz, siyah buzda kış lastiği (sabit sezon yok).",
      ro: "Situațional: anvelope de iarnă la zăpadă, gheață sau polei (fără sezon fix).",
    },
    period: {
      bg: "При зимни пътни условия",
      en: "In winter road conditions",
      tr: "Kış yol koşullarında",
      ro: "În condiții de drum de iarnă",
    },
    chains: {
      bg: "Само ако е указано с знак.",
      en: "Only when a sign requires them.",
      tr: "Yalnızca işaret gerektirdiğinde.",
      ro: "Doar când un semn o impune.",
    },
  },
  {
    country_code: "SI",
    name_bg: "Словения",
    summary: {
      bg: "Зимни гуми или вериги в определения период.",
      en: "Winter tyres or chains in the defined period.",
      tr: "Belirtilen dönemde kış lastiği veya zincir.",
      ro: "Anvelope de iarnă sau lanțuri în perioada definită.",
    },
    period: {
      bg: "15 ноември – 15 март",
      en: "15 November – 15 March",
      tr: "15 Kasım – 15 Mart",
      ro: "15 noiembrie – 15 martie",
    },
    chains: {
      bg: "Вериги като алтернатива на зимни гуми.",
      en: "Chains as an alternative to winter tyres.",
      tr: "Kış lastiğine alternatif olarak zincir.",
      ro: "Lanțuri ca alternativă la anvelopele de iarnă.",
    },
  },
  {
    country_code: "HR",
    name_bg: "Хърватия",
    summary: {
      bg: "Зимно оборудване на определени участъци / при зимни условия.",
      en: "Winter equipment on designated sections / in winter conditions.",
      tr: "Belirli kesimlerde / kış koşullarında kış donanımı.",
      ro: "Echipament de iarnă pe sectoare desemnate / în condiții de iarnă.",
    },
    period: {
      bg: "15 ноември – 15 април",
      en: "15 November – 15 April",
      tr: "15 Kasım – 15 Nisan",
      ro: "15 noiembrie – 15 aprilie",
    },
    chains: {
      bg: "Вериги задължителни при знак / сняг.",
      en: "Chains mandatory when signed / in snow.",
      tr: "İşaret veya kar varken zincir zorunlu.",
      ro: "Lanțuri obligatorii la semn / zăpadă.",
    },
  },
  {
    country_code: "RO",
    name_bg: "Румъния",
    summary: {
      bg: "Зимни гуми при сняг или лед на пътя.",
      en: "Winter tyres when there is snow or ice on the road.",
      tr: "Yolda kar veya buz varken kış lastiği.",
      ro: "Anvelope de iarnă la zăpadă sau gheață pe drum.",
    },
    period: {
      bg: "1 ноември – 31 март",
      en: "1 November – 31 March",
      tr: "1 Kasım – 31 Mart",
      ro: "1 noiembrie – 31 martie",
    },
    chains: {
      bg: "Вериги в планините при сигнализация.",
      en: "Chains in the mountains when signs require them.",
      tr: "İşaret olduğunda dağlarda zincir.",
      ro: "Lanțuri la munte când semnalizarea o cere.",
    },
  },
  {
    country_code: "HU",
    name_bg: "Унгария",
    summary: {
      bg: "Няма общ сезон за леки коли; зимни гуми силно препоръчителни.",
      en: "No general season for cars; winter tyres strongly recommended.",
      tr: "Binek araçlar için genel sezon yok; kış lastiği şiddetle önerilir.",
      ro: "Fără sezon general pentru autoturisme; anvelope de iarnă foarte recomandate.",
    },
    period: {
      bg: "Препоръка през зимата",
      en: "Recommended in winter",
      tr: "Kış boyunca öneri",
      ro: "Recomandare pe timp de iarnă",
    },
    chains: {
      bg: "Вериги при знак.",
      en: "Chains when a sign requires them.",
      tr: "İşaret gerektirdiğinde zincir.",
      ro: "Lanțuri când un semn o cere.",
    },
  },
  {
    country_code: "CZ",
    name_bg: "Чехия",
    summary: {
      bg: "Зимни гуми на означени пътища / при зимни условия.",
      en: "Winter tyres on designated roads / in winter conditions.",
      tr: "İşaretli yollarda / kış koşullarında kış lastiği.",
      ro: "Anvelope de iarnă pe drumuri desemnate / în condiții de iarnă.",
    },
    period: {
      bg: "1 ноември – 31 март",
      en: "1 November – 31 March",
      tr: "1 Kasım – 31 Mart",
      ro: "1 noiembrie – 31 martie",
    },
    chains: {
      bg: "Вериги при знак.",
      en: "Chains when a sign requires them.",
      tr: "İşaret gerektirdiğinde zincir.",
      ro: "Lanțuri când un semn o cere.",
    },
  },
  {
    country_code: "SK",
    name_bg: "Словакия",
    summary: {
      bg: "Зимни гуми при сняг или лед.",
      en: "Winter tyres in snow or ice.",
      tr: "Kar veya buzda kış lastiği.",
      ro: "Anvelope de iarnă la zăpadă sau gheață.",
    },
    period: {
      bg: "15 ноември – 31 март",
      en: "15 November – 31 March",
      tr: "15 Kasım – 31 Mart",
      ro: "15 noiembrie – 31 martie",
    },
    chains: {
      bg: "Вериги в планините при знак.",
      en: "Chains in the mountains when signs require them.",
      tr: "Dağlarda işaret gerektirdiğinde zincir.",
      ro: "Lanțuri la munte când semnalizarea o cere.",
    },
  },
  {
    country_code: "CH",
    name_bg: "Швейцария",
    summary: {
      bg: "Няма общ мандат, но отговорност при зимни условия.",
      en: "No blanket mandate, but liability in winter conditions.",
      tr: "Genel zorunluluk yok; kış koşullarında sorumluluk sizde.",
      ro: "Fără mandat general, dar răspundere în condiții de iarnă.",
    },
    period: {
      bg: "При зимни условия",
      en: "In winter conditions",
      tr: "Kış koşullarında",
      ro: "În condiții de iarnă",
    },
    chains: {
      bg: "Вериги често задължителни по алпийски проходи.",
      en: "Chains often mandatory on Alpine passes.",
      tr: "Alp geçitlerinde zincir sık sık zorunlu.",
      ro: "Lanțuri des obligatorii pe trecerile alpine.",
    },
  },
  {
    country_code: "RS",
    name_bg: "Сърбия",
    summary: {
      bg: "Зимни гуми задължителни в сезона.",
      en: "Winter tyres mandatory in the season.",
      tr: "Sezonda kış lastiği zorunlu.",
      ro: "Anvelope de iarnă obligatorii în sezon.",
    },
    period: {
      bg: "1 ноември – 1 април",
      en: "1 November – 1 April",
      tr: "1 Kasım – 1 Nisan",
      ro: "1 noiembrie – 1 aprilie",
    },
    chains: {
      bg: "Вериги в автомобила през зимата.",
      en: "Carry chains in the car in winter.",
      tr: "Kışın araçta zincir bulundurun.",
      ro: "Purtați lanțuri în mașină iarna.",
    },
  },
  {
    country_code: "MK",
    name_bg: "Северна Македония",
    summary: {
      bg: "Зимни гуми в определения период.",
      en: "Winter tyres in the defined period.",
      tr: "Belirtilen dönemde kış lastiği.",
      ro: "Anvelope de iarnă în perioada definită.",
    },
    period: {
      bg: "15 ноември – 15 март",
      en: "15 November – 15 March",
      tr: "15 Kasım – 15 Mart",
      ro: "15 noiembrie – 15 martie",
    },
    chains: {
      bg: "Вериги при сняг в планините.",
      en: "Chains in snow in the mountains.",
      tr: "Dağlarda kar varken zincir.",
      ro: "Lanțuri la zăpadă la munte.",
    },
  },
  {
    country_code: "GR",
    name_bg: "Гърция",
    summary: {
      bg: "Вериги при зимни условия в планините (няма национален сезон за всички пътища).",
      en: "Chains in winter conditions in the mountains (no national season for all roads).",
      tr: "Dağlarda kış koşullarında zincir (tüm yollar için ulusal sezon yok).",
      ro: "Lanțuri în condiții de iarnă la munte (fără sezon național pentru toate drumurile).",
    },
    period: {
      bg: "При сняг / лед",
      en: "In snow / ice",
      tr: "Kar / buzda",
      ro: "La zăpadă / gheață",
    },
    chains: {
      bg: "Вериги задължителни при съответна заповед/знак.",
      en: "Chains mandatory when an order or sign requires them.",
      tr: "Emir veya işaret gerektirdiğinde zincir zorunlu.",
      ro: "Lanțuri obligatorii la ordin sau semn corespunzător.",
    },
  },
  {
    country_code: "IT",
    name_bg: "Италия",
    summary: {
      bg: "Зимни гуми или вериги по участъци (особено Алпи / Aosta).",
      en: "Winter tyres or chains on certain sections (especially Alps / Aosta).",
      tr: "Bazı kesimlerde kış lastiği veya zincir (özellikle Alpler / Aosta).",
      ro: "Anvelope de iarnă sau lanțuri pe anumite sectoare (în special Alpi / Aosta).",
    },
    period: {
      bg: "15 ноември – 15 април (локално)",
      en: "15 November – 15 April (locally)",
      tr: "15 Kasım – 15 Nisan (yerel)",
      ro: "15 noiembrie – 15 aprilie (local)",
    },
    chains: {
      bg: "Вериги като алтернатива на зимни гуми.",
      en: "Chains as an alternative to winter tyres.",
      tr: "Kış lastiğine alternatif olarak zincir.",
      ro: "Lanțuri ca alternativă la anvelopele de iarnă.",
    },
  },
  {
    country_code: "FR",
    name_bg: "Франция",
    summary: {
      bg: "Закон „Montagne“: зимно оборудване в определени планински зони.",
      en: "Montagne law: winter equipment in designated mountain zones.",
      tr: "Montagne yasası: belirlenen dağ bölgelerinde kış donanımı.",
      ro: "Legea Montagne: echipament de iarnă în zone montane desemnate.",
    },
    period: {
      bg: "1 ноември – 31 март (в означените зони)",
      en: "1 November – 31 March (in marked zones)",
      tr: "1 Kasım – 31 Mart (işaretli bölgelerde)",
      ro: "1 noiembrie – 31 martie (în zonele marcate)",
    },
    chains: {
      bg: "Вериги или зимни гуми според зоната.",
      en: "Chains or winter tyres depending on the zone.",
      tr: "Bölgeye göre zincir veya kış lastiği.",
      ro: "Lanțuri sau anvelope de iarnă în funcție de zonă.",
    },
  },
];

export const WINTER_RULES_DISCLAIMER: Localized = {
  bg: "Обобщение за ориентация, не юридически съвет. Проверете актуалните правила преди пътуване.",
  en: "Summary for orientation only, not legal advice. Check current rules before you travel.",
  tr: "Yalnızca yön bulmak için özet, hukuki tavsiye değil. Yola çıkmadan güncel kuralları kontrol edin.",
  ro: "Rezumat orientativ, nu sfat juridic. Verificați regulile actuale înainte de plecare.",
};

/** @deprecated use WINTER_RULES_DISCLAIMER with pickText */
export const WINTER_RULES_DISCLAIMER_BG = WINTER_RULES_DISCLAIMER.bg;

export function winterRuleName(locale: Locale, rule: WinterRule): string {
  return countryName(rule.country_code, locale);
}

export function winterRuleSummary(locale: Locale, rule: WinterRule): string {
  return pickText(locale, rule.summary);
}

export function winterRulePeriod(locale: Locale, rule: WinterRule): string {
  return pickText(locale, rule.period);
}

export function winterRuleChains(locale: Locale, rule: WinterRule): string {
  return pickText(locale, rule.chains);
}