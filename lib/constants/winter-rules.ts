/**
 * Winter tyre / chain rules — curated, not live law.
 * Always labelled as guidance; check official sources before travel.
 */

export interface WinterRule {
  country_code: string;
  name_bg: string;
  summary_bg: string;
  period_bg: string;
  chains_bg: string;
}

export const WINTER_RULES: WinterRule[] = [
  {
    country_code: "BG",
    name_bg: "България",
    summary_bg: "Зимни гуми или гуми с дълбочина ≥ 4 мм при зимни условия.",
    period_bg: "15 ноември – 1 март (практика / наредби за зимни условия)",
    chains_bg: "Вериги в автомобила са препоръчителни в планините.",
  },
  {
    country_code: "AT",
    name_bg: "Австрия",
    summary_bg: "Зимни гуми задължителни при зимни условия.",
    period_bg: "1 ноември – 15 април",
    chains_bg: "Вериги при съответна пътна сигнализация.",
  },
  {
    country_code: "DE",
    name_bg: "Германия",
    summary_bg:
      "Ситуационно: зимни гуми при сняг, лед, поледица (не фиксиран сезон).",
    period_bg: "При зимни пътни условия",
    chains_bg: "Само ако е указано с знак.",
  },
  {
    country_code: "SI",
    name_bg: "Словения",
    summary_bg: "Зимни гуми или вериги в определения период.",
    period_bg: "15 ноември – 15 март",
    chains_bg: "Вериги като алтернатива на зимни гуми.",
  },
  {
    country_code: "HR",
    name_bg: "Хърватия",
    summary_bg: "Зимно оборудване на определени участъци / при зимни условия.",
    period_bg: "15 ноември – 15 април",
    chains_bg: "Вериги задължителни при знак / сняг.",
  },
  {
    country_code: "RO",
    name_bg: "Румъния",
    summary_bg: "Зимни гуми при сняг или лед на пътя.",
    period_bg: "1 ноември – 31 март",
    chains_bg: "Вериги в планините при сигнализация.",
  },
  {
    country_code: "HU",
    name_bg: "Унгария",
    summary_bg: "Няма общ сезон за леки коли; зимни гуми силно препоръчителни.",
    period_bg: "Препоръка през зимата",
    chains_bg: "Вериги при знак.",
  },
  {
    country_code: "CZ",
    name_bg: "Чехия",
    summary_bg: "Зимни гуми на означени пътища / при зимни условия.",
    period_bg: "1 ноември – 31 март",
    chains_bg: "Вериги при знак.",
  },
  {
    country_code: "SK",
    name_bg: "Словакия",
    summary_bg: "Зимни гуми при сняг или лед.",
    period_bg: "15 ноември – 31 март",
    chains_bg: "Вериги в планините при знак.",
  },
  {
    country_code: "CH",
    name_bg: "Швейцария",
    summary_bg: "Няма общ мандат, но отговорност при зимни условия.",
    period_bg: "При зимни условия",
    chains_bg: "Вериги често задължителни по алпийски проходи.",
  },
  {
    country_code: "RS",
    name_bg: "Сърбия",
    summary_bg: "Зимни гуми задължителни в сезона.",
    period_bg: "1 ноември – 1 април",
    chains_bg: "Вериги в автомобила през зимата.",
  },
  {
    country_code: "MK",
    name_bg: "Северна Македония",
    summary_bg: "Зимни гуми в определения период.",
    period_bg: "15 ноември – 15 март",
    chains_bg: "Вериги при сняг в планините.",
  },
  {
    country_code: "GR",
    name_bg: "Гърция",
    summary_bg:
      "Вериги при зимни условия в планините (няма национален сезон за всички пътища).",
    period_bg: "При сняг / лед",
    chains_bg: "Вериги задължителни при съответна заповед/знак.",
  },
  {
    country_code: "IT",
    name_bg: "Италия",
    summary_bg: "Зимни гуми или вериги по участъци (особено Алпи / Aosta).",
    period_bg: "15 ноември – 15 април (локално)",
    chains_bg: "Вериги като алтернатива на зимни гуми.",
  },
  {
    country_code: "FR",
    name_bg: "Франция",
    summary_bg:
      "Закон „Montagne“: зимно оборудване в определени планински зони.",
    period_bg: "1 ноември – 31 март (в означените зони)",
    chains_bg: "Вериги или зимни гуми според зоната.",
  },
];

export const WINTER_RULES_DISCLAIMER_BG =
  "Обобщение за ориентация, не юридически съвет. Проверете актуалните правила преди пътуване.";
