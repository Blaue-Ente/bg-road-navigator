/**
 * Popular long-haul corridors for Bulgarian travelers across Europe
 */

export interface TravelCorridor {
  id: string;
  label: string;
  description: string;
  cityIds: string[];
  borderIds: string[];
  estimatedHours: number;
}

export const TRAVEL_CORRIDORS: TravelCorridor[] = [
  {
    id: "london-sofia",
    label: "Лондон → София",
    description: "Класически маршрут през Западна и Централна Европа, ~30+ часа",
    cityIds: ["london", "brussels", "cologne", "frankfurt", "munich", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["calais", "kehl-strasbourg", "suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 32,
  },
  {
    id: "berlin-sofia",
    label: "Берлин → София",
    description: "През Полша, Чехия/Австрия или Унгария",
    cityIds: ["berlin", "prague", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["frankfurt-oder", "suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 18,
  },
  {
    id: "munich-sofia",
    label: "Мюнхен → София",
    description: "Най-честият маршрут от Германия, ~12–14 часа",
    cityIds: ["munich", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 13,
  },
  {
    id: "paris-sofia",
    label: "Париж → София",
    description: "През Германия и Австрия/Унгария",
    cityIds: ["paris", "brussels", "cologne", "frankfurt", "munich", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["kehl-strasbourg", "suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 22,
  },
  {
    id: "amsterdam-sofia",
    label: "Амстердам → София",
    description: "През Германия и Централна Европа",
    cityIds: ["amsterdam", "cologne", "frankfurt", "munich", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["kehl-strasbourg", "suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 24,
  },
  {
    id: "madrid-sofia",
    label: "Мадрид → София",
    description: "През Франция, Германия и Балканите — 35+ часа",
    cityIds: ["madrid", "barcelona", "lyon", "frankfurt", "munich", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["mont-blanc", "kehl-strasbourg", "suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 36,
  },
  {
    id: "barcelona-sofia",
    label: "Барселона → София",
    description: "През Франция и Централна Европа",
    cityIds: ["barcelona", "lyon", "frankfurt", "munich", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["mont-blanc", "kehl-strasbourg", "suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 28,
  },
  {
    id: "milan-sofia",
    label: "Милано → София",
    description: "През Словения, Хърватия и Сърбия",
    cityIds: ["milan", "ljubljana", "zagreb", "belgrade", "sofia"],
    borderIds: ["chiasso", "gorizia", "obrezje", "bajakovo", "kalotina"],
    estimatedHours: 16,
  },
  {
    id: "zagreb-sofia",
    label: "Загреб → София",
    description: "През Сърбия — по-бърз балкански маршрут",
    cityIds: ["zagreb", "belgrade", "sofia"],
    borderIds: ["bajakovo", "kalotina"],
    estimatedHours: 9,
  },
  {
    id: "vienna-sofia",
    label: "Виена → София",
    description: "Класически маршрут през Унгария и Сърбия",
    cityIds: ["vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["nickelsdorf", "horgos", "kalotina"],
    estimatedHours: 11,
  },
  {
    id: "prague-sofia",
    label: "Прага → София",
    description: "През Братислава/Унгария или Австрия",
    cityIds: ["prague", "bratislava", "budapest", "belgrade", "sofia"],
    borderIds: ["komarno", "horgos", "kalotina"],
    estimatedHours: 14,
  },
  {
    id: "stockholm-sofia",
    label: "Стокхолм → София",
    description: "Скандинавия — Германия — Балкани, 40+ часа",
    cityIds: ["stockholm", "copenhagen", "hamburg", "berlin", "prague", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["frankfurt-oder", "suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 40,
  },
  {
    id: "athens-sofia",
    label: "Атина → София",
    description: "През Гърция — Кулата или Промахон",
    cityIds: ["athens", "thessaloniki", "sofia"],
    borderIds: ["kulata", "promachon"],
    estimatedHours: 8,
  },
  {
    id: "istanbul-sofia",
    label: "Истанбул → София",
    description: "През Капитан Андреево или Лесово",
    cityIds: ["istanbul", "sofia"],
    borderIds: ["kapitan-andreevo", "lesovo"],
    estimatedHours: 6,
  },
  {
    id: "bucharest-sofia",
    label: "Букурещ → София",
    description: "През Дунав мост или Русе",
    cityIds: ["bucharest", "ruse", "sofia"],
    borderIds: ["danube-bridge-ruse", "danube-bridge-vidin"],
    estimatedHours: 5,
  },
  {
    id: "milan-athens",
    label: "Милано → Атина",
    description: "Транзит през Балканите — дълго пътуване",
    cityIds: ["milan", "zagreb", "belgrade", "skopje", "thessaloniki", "athens"],
    borderIds: ["gorizia", "batrovci", "presevo", "kulata"],
    estimatedHours: 20,
  },
  {
    id: "sofia-london",
    label: "София → Лондон",
    description: "Обратен маршрут към Западна Европа",
    cityIds: ["sofia", "belgrade", "budapest", "vienna", "munich", "frankfurt", "brussels", "london"],
    borderIds: ["kalotina", "batrovci", "nickelsdorf", "suben", "calais"],
    estimatedHours: 32,
  },
  {
    id: "sofia-munich",
    label: "София → Мюнхен",
    description: "Обратен маршрут от България към Германия",
    cityIds: ["sofia", "belgrade", "budapest", "vienna", "munich"],
    borderIds: ["kalotina", "horgos", "nickelsdorf", "suben"],
    estimatedHours: 13,
  },
];
