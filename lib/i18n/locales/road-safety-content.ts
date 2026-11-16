/**
 * Road-safety copy for the checklist when the route enters Bulgaria.
 * One module so every locale stays in sync by item id.
 */
import type { Locale } from "@/lib/i18n/locale";

export interface RoadSafetyItem {
  id: string;
  title: string;
  detail: string;
}

export interface RoadSafetyLink {
  id: string;
  title: string;
  detail: string;
  href: string;
  link_label: string;
}

export interface RoadSafetyCopy {
  title: string;
  law_label: string;
  advice_label: string;
  closing: string;
  law: RoadSafetyItem[];
  advice: RoadSafetyItem[];
  links: RoadSafetyLink[];
}

const LAW_IDS = [
  "bg-belts",
  "bg-child-seat",
  "bg-lights",
  "bg-limits",
  "bg-phone",
  "bg-alcohol",
  "bg-winter-tyres",
  "bg-vulnerable",
] as const;

const ADVICE_IDS = ["bg-rest"] as const;

const LINK_IDS = ["bg-sars-ukptp", "bg-traffic-api"] as const;

export const ROAD_SAFETY: Record<Locale, RoadSafetyCopy> = {
  bg: {
    title: "Безопасност в България",
    law_label: "Закон",
    advice_label: "Препоръка",
    closing: "Пазете себе си и другите на пътя.",
    law: [
      {
        id: "bg-belts",
        title: "Колани",
        detail: "Колан за всички, включително на задните седалки.",
      },
      {
        id: "bg-child-seat",
        title: "Детско столче",
        detail:
          "Дете под 150 см пътува в подходящо столче. Столче, обърнато назад, не се поставя отпред при включена въздушна възглавница.",
      },
      {
        id: "bg-lights",
        title: "Светлини през деня",
        detail:
          "Дневни светлини или къси фарове са задължителни целогодишно през деня.",
      },
      {
        id: "bg-limits",
        title: "Скорост",
        detail:
          "Ограниченията са 50/90/120/140 км/ч, освен ако знакът показва друго. Участъците със средна скорост се контролират.",
      },
      {
        id: "bg-phone",
        title: "Телефон",
        detail: "Телефонът се ползва само със свободни ръце.",
      },
      {
        id: "bg-alcohol",
        title: "Алкохол",
        detail: "Границата за алкохол е 0,5‰.",
      },
      {
        id: "bg-winter-tyres",
        title: "Зимни гуми",
        detail:
          "От 15 ноември до 1 март са нужни зимни гуми или протектор поне 4 мм.",
      },
      {
        id: "bg-vulnerable",
        title: "Уязвими участници",
        detail:
          "Карайте внимателно и пазете пешеходците, велосипедистите и мотористите.",
      },
    ],
    advice: [
      {
        id: "bg-rest",
        title: "Почивка",
        detail: "Почивайте около всеки 2 часа.",
      },
    ],
    links: [
      {
        id: "bg-sars-ukptp",
        title: "Опасни участъци",
        detail:
          "Официален списък на ДАБДП за участъци с концентрация на пътнотранспортни произшествия.",
        href: "https://www.sars.gov.bg/uchastatsi-s-kontsentratsia-na-patnotransportni-proizshestvia-ukptp/",
        link_label: "Виж участъците",
      },
      {
        id: "bg-traffic-api",
        title: "Трафик на АПИ",
        detail: "Официална страница за движението по републиканските пътища.",
        href: "https://traffic.api.bg/",
        link_label: "traffic.api.bg",
      },
    ],
  },
  en: {
    title: "Safety in Bulgaria",
    law_label: "Law",
    advice_label: "Recommendation",
    closing: "Look after yourself and others on the road.",
    law: [
      {
        id: "bg-belts",
        title: "Seat belts",
        detail: "A seat belt for everyone, including rear seats.",
      },
      {
        id: "bg-child-seat",
        title: "Child seat",
        detail:
          "A child under 150 cm must use a suitable seat. Do not place a rear-facing seat in front when the airbag is active.",
      },
      {
        id: "bg-lights",
        title: "Daytime lights",
        detail:
          "Daytime running lights or dipped headlights are mandatory all year round during the day.",
      },
      {
        id: "bg-limits",
        title: "Speed",
        detail:
          "Limits are 50/90/120/140 km/h unless signs say otherwise. Average-speed sections are enforced.",
      },
      {
        id: "bg-phone",
        title: "Phone",
        detail: "Phones may only be used hands-free.",
      },
      {
        id: "bg-alcohol",
        title: "Alcohol",
        detail: "The alcohol limit is 0.5‰.",
      },
      {
        id: "bg-winter-tyres",
        title: "Winter tyres",
        detail:
          "From 15 November to 1 March you need winter tyres or tread depth of at least 4 mm.",
      },
      {
        id: "bg-vulnerable",
        title: "Vulnerable road users",
        detail:
          "Drive carefully and watch out for pedestrians, cyclists and motorcyclists.",
      },
    ],
    advice: [
      {
        id: "bg-rest",
        title: "Rest",
        detail: "Take a break about every 2 hours.",
      },
    ],
    links: [
      {
        id: "bg-sars-ukptp",
        title: "Accident hotspots",
        detail:
          "Official RIA list of sections with a concentration of road accidents.",
        href: "https://www.sars.gov.bg/uchastatsi-s-kontsentratsia-na-patnotransportni-proizshestvia-ukptp/",
        link_label: "View sections",
      },
      {
        id: "bg-traffic-api",
        title: "API traffic",
        detail: "Official page for traffic on national roads.",
        href: "https://traffic.api.bg/",
        link_label: "traffic.api.bg",
      },
    ],
  },
  tr: {
    title: "Bulgaristan'da güvenlik",
    law_label: "Yasa",
    advice_label: "Öneri",
    closing: "Yolda kendinize ve başkalarına dikkat edin.",
    law: [
      {
        id: "bg-belts",
        title: "Emniyet kemeri",
        detail: "Arka koltuklar dahil herkes için emniyet kemeri zorunlu.",
      },
      {
        id: "bg-child-seat",
        title: "Çocuk koltuğu",
        detail:
          "150 cm altındaki çocuk uygun koltukta seyahat eder. Hava yastığı açıkken önde arkaya dönük koltuk kullanılmaz.",
      },
      {
        id: "bg-lights",
        title: "Gündüz aydınlatması",
        detail:
          "Gündüz farları veya kısa farlar yıl boyunca gündüz zorunludur.",
      },
      {
        id: "bg-limits",
        title: "Hız",
        detail:
          "Sınırlar işaret aksine 50/90/120/140 km/s. Ortalama hız bölümleri denetlenir.",
      },
      {
        id: "bg-phone",
        title: "Telefon",
        detail: "Telefon yalnızca eller serbest kullanılır.",
      },
      {
        id: "bg-alcohol",
        title: "Alkol",
        detail: "Alkol sınırı 0,5‰.",
      },
      {
        id: "bg-winter-tyres",
        title: "Kış lastikleri",
        detail:
          "15 Kasım – 1 Mart arası kış lastiği veya en az 4 mm diş derinliği gerekir.",
      },
      {
        id: "bg-vulnerable",
        title: "Savunmasız yol kullanıcıları",
        detail:
          "Dikkatli sürün; yayaları, bisikletlileri ve motosikletlileri koruyun.",
      },
    ],
    advice: [
      {
        id: "bg-rest",
        title: "Mola",
        detail: "Yaklaşık her 2 saatte bir mola verin.",
      },
    ],
    links: [
      {
        id: "bg-sars-ukptp",
        title: "Riskli kesimler",
        detail:
          "Yol kazalarının yoğunlaştığı kesimler için resmi Yol Altyapı Ajansı listesi.",
        href: "https://www.sars.gov.bg/uchastatsi-s-kontsentratsia-na-patnotransportni-proizshestvia-ukptp/",
        link_label: "Kesimleri gör",
      },
      {
        id: "bg-traffic-api",
        title: "API trafik",
        detail: "Devlet yollarındaki trafik için resmi sayfa.",
        href: "https://traffic.api.bg/",
        link_label: "traffic.api.bg",
      },
    ],
  },
  ro: {
    title: "Siguranța în Bulgaria",
    law_label: "Lege",
    advice_label: "Recomandare",
    closing: "Aveți grijă de dvs. și de ceilalți pe drum.",
    law: [
      {
        id: "bg-belts",
        title: "Centuri de siguranță",
        detail: "Centură pentru toți, inclusiv pe scaunele din spate.",
      },
      {
        id: "bg-child-seat",
        title: "Scaun copil",
        detail:
          "Copilul sub 150 cm călătorește într-un scaun potrivit. Scaunul cu spatele spre față nu se montează în față când airbagul este activ.",
      },
      {
        id: "bg-lights",
        title: "Lumini de zi",
        detail:
          "Luminile de zi sau faza scurtă sunt obligatorii tot anul în timpul zilei.",
      },
      {
        id: "bg-limits",
        title: "Viteză",
        detail:
          "Limitele sunt 50/90/120/140 km/h, dacă indicatoarele nu spun altfel. Secțiunile cu viteză medie sunt monitorizate.",
      },
      {
        id: "bg-phone",
        title: "Telefon",
        detail: "Telefonul se folosește numai cu mâinile libere.",
      },
      {
        id: "bg-alcohol",
        title: "Alcool",
        detail: "Limita de alcool este 0,5‰.",
      },
      {
        id: "bg-winter-tyres",
        title: "Anvelope de iarnă",
        detail:
          "Între 15 noiembrie și 1 martie sunt necesare anvelope de iarnă sau adâncime de cel puțin 4 mm.",
      },
      {
        id: "bg-vulnerable",
        title: "Participanți vulnerabili",
        detail:
          "Conduceți atent și protejați pietonii, bicicliștii și motocicliștii.",
      },
    ],
    advice: [
      {
        id: "bg-rest",
        title: "Pauză",
        detail: "Faceți pauză la aproximativ 2 ore.",
      },
    ],
    links: [
      {
        id: "bg-sars-ukptp",
        title: "Sectoare periculoase",
        detail:
          "Lista oficială a AAI pentru sectoare cu concentrare de accidente rutiere.",
        href: "https://www.sars.gov.bg/uchastatsi-s-kontsentratsia-na-patnotransportni-proizshestvia-ukptp/",
        link_label: "Vedeți sectoarele",
      },
      {
        id: "bg-traffic-api",
        title: "Trafic API",
        detail: "Pagina oficială pentru traficul pe drumurile naționale.",
        href: "https://traffic.api.bg/",
        link_label: "traffic.api.bg",
      },
    ],
  },
};

export function roadSafetyCopy(locale: Locale): RoadSafetyCopy {
  return ROAD_SAFETY[locale];
}

/** Same item ids in every locale — for tests. */
export const ROAD_SAFETY_ITEM_IDS = {
  law: LAW_IDS,
  advice: ADVICE_IDS,
  links: LINK_IDS,
};

/** @deprecated use roadSafetyCopy */
export const BG_ROAD_SAFETY = ROAD_SAFETY.bg;