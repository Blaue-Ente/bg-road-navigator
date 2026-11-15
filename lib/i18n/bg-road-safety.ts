/**
 * Bulgarian road-safety copy for the checklist.
 * One file so a later locale can replace this module without hunting strings.
 */
export const BG_ROAD_SAFETY = {
  locale: "bg" as const,
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
};
