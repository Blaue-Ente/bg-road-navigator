/**
 * Major European cities for route planning
 * Grouped by region — covers typical Bulgarian travel corridors
 */

export interface EuropeanCity {
  id: string;
  label: string;
  country: string;
  countryCode: string;
  region: EuropeanRegion;
  coords: { lng: number; lat: number };
}

export type EuropeanRegion =
  | "bulgaria"
  | "balkans"
  | "central"
  | "western"
  | "southern"
  | "eastern"
  | "nordic"
  | "uk";

export const REGION_LABELS: Record<EuropeanRegion, string> = {
  bulgaria: "България",
  balkans: "Балкани",
  central: "Централна Европа",
  western: "Западна Европа",
  southern: "Южна Европа",
  eastern: "Източна Европа",
  nordic: "Скандинавия",
  uk: "Обединено кралство",
};

export const EUROPEAN_CITIES: EuropeanCity[] = [
  // България
  { id: "sofia", label: "София", country: "България", countryCode: "BG", region: "bulgaria", coords: { lng: 23.3219, lat: 42.6977 } },
  { id: "plovdiv", label: "Пловдив", country: "България", countryCode: "BG", region: "bulgaria", coords: { lng: 24.7453, lat: 42.1354 } },
  { id: "varna", label: "Варна", country: "България", countryCode: "BG", region: "bulgaria", coords: { lng: 27.9147, lat: 43.2141 } },
  { id: "burgas", label: "Бургас", country: "България", countryCode: "BG", region: "bulgaria", coords: { lng: 27.4626, lat: 42.5048 } },
  { id: "ruse", label: "Русе", country: "България", countryCode: "BG", region: "bulgaria", coords: { lng: 25.9708, lat: 43.8356 } },
  // Балкани
  { id: "belgrade", label: "Белград", country: "Сърбия", countryCode: "RS", region: "balkans", coords: { lng: 20.4489, lat: 44.7866 } },
  { id: "nis", label: "Ниш", country: "Сърбия", countryCode: "RS", region: "balkans", coords: { lng: 21.8958, lat: 43.3209 } },
  { id: "bucharest", label: "Букурещ", country: "Румъния", countryCode: "RO", region: "balkans", coords: { lng: 26.1025, lat: 44.4268 } },
  { id: "thessaloniki", label: "Солун", country: "Гърция", countryCode: "GR", region: "balkans", coords: { lng: 22.9444, lat: 40.6401 } },
  { id: "athens", label: "Атина", country: "Гърция", countryCode: "GR", region: "balkans", coords: { lng: 23.7275, lat: 37.9838 } },
  { id: "istanbul", label: "Истанбул", country: "Турция", countryCode: "TR", region: "balkans", coords: { lng: 28.9784, lat: 41.0082 } },
  { id: "skopje", label: "Скопие", country: "С. Македония", countryCode: "MK", region: "balkans", coords: { lng: 21.4254, lat: 41.9981 } },
  { id: "tirana", label: "Тирана", country: "Албания", countryCode: "AL", region: "balkans", coords: { lng: 19.8187, lat: 41.3275 } },
  // Централна Европа
  { id: "vienna", label: "Виена", country: "Австрия", countryCode: "AT", region: "central", coords: { lng: 16.3738, lat: 48.2082 } },
  { id: "budapest", label: "Будапеща", country: "Унгария", countryCode: "HU", region: "central", coords: { lng: 19.0402, lat: 47.4979 } },
  { id: "prague", label: "Прага", country: "Чехия", countryCode: "CZ", region: "central", coords: { lng: 14.4378, lat: 50.0755 } },
  { id: "warsaw", label: "Варшава", country: "Полша", countryCode: "PL", region: "central", coords: { lng: 21.0122, lat: 52.2297 } },
  { id: "krakow", label: "Краков", country: "Полша", countryCode: "PL", region: "central", coords: { lng: 19.945, lat: 50.0647 } },
  { id: "munich", label: "Мюнхен", country: "Германия", countryCode: "DE", region: "central", coords: { lng: 11.582, lat: 48.1351 } },
  { id: "frankfurt", label: "Франкфурт", country: "Германия", countryCode: "DE", region: "central", coords: { lng: 8.6821, lat: 50.1109 } },
  { id: "berlin", label: "Берлин", country: "Германия", countryCode: "DE", region: "central", coords: { lng: 13.405, lat: 52.52 } },
  { id: "zurich", label: "Цюрих", country: "Швейцария", countryCode: "CH", region: "central", coords: { lng: 8.5417, lat: 47.3769 } },
  // Западна Европа
  { id: "paris", label: "Париж", country: "Франция", countryCode: "FR", region: "western", coords: { lng: 2.3522, lat: 48.8566 } },
  { id: "brussels", label: "Брюксел", country: "Белгия", countryCode: "BE", region: "western", coords: { lng: 4.3517, lat: 50.8503 } },
  { id: "amsterdam", label: "Амстердам", country: "Холандия", countryCode: "NL", region: "western", coords: { lng: 4.9041, lat: 52.3676 } },
  { id: "cologne", label: "Кьолн", country: "Германия", countryCode: "DE", region: "western", coords: { lng: 6.9603, lat: 50.9375 } },
  // Южна Европа
  { id: "milan", label: "Милано", country: "Италия", countryCode: "IT", region: "southern", coords: { lng: 9.19, lat: 45.4642 } },
  { id: "rome", label: "Рим", country: "Италия", countryCode: "IT", region: "southern", coords: { lng: 12.4964, lat: 41.9028 } },
  { id: "barcelona", label: "Барселона", country: "Испания", countryCode: "ES", region: "southern", coords: { lng: 2.1734, lat: 41.3851 } },
  { id: "madrid", label: "Мадрид", country: "Испания", countryCode: "ES", region: "southern", coords: { lng: -3.7038, lat: 40.4168 } },
  { id: "zagreb", label: "Загреб", country: "Хърватия", countryCode: "HR", region: "southern", coords: { lng: 15.9819, lat: 45.815 } },
  { id: "ljubljana", label: "Любляна", country: "Словения", countryCode: "SI", region: "southern", coords: { lng: 14.5058, lat: 46.0569 } },
  // Източна Европа
  { id: "budapest-east", label: "Дебрецен", country: "Унгария", countryCode: "HU", region: "eastern", coords: { lng: 21.6273, lat: 47.5316 } },
  { id: "chisinau", label: "Кишинев", country: "Молдова", countryCode: "MD", region: "eastern", coords: { lng: 28.8638, lat: 47.0105 } },
  { id: "lviv", label: "Лвов", country: "Украйна", countryCode: "UA", region: "eastern", coords: { lng: 24.0297, lat: 49.8397 } },
  { id: "odesa", label: "Одеса", country: "Украйна", countryCode: "UA", region: "eastern", coords: { lng: 30.7233, lat: 46.4825 } },
  // UK
  { id: "london", label: "Лондон", country: "Великобритания", countryCode: "GB", region: "uk", coords: { lng: -0.1276, lat: 51.5074 } },
  // Nordic
  { id: "copenhagen", label: "Копенхаген", country: "Дания", countryCode: "DK", region: "nordic", coords: { lng: 12.5683, lat: 55.6761 } },
  { id: "stockholm", label: "Стокхолм", country: "Швеция", countryCode: "SE", region: "nordic", coords: { lng: 18.0686, lat: 59.3293 } },
];

export function getCityByLabel(label: string): EuropeanCity | undefined {
  return EUROPEAN_CITIES.find((c) => c.label === label);
}

export function getCitiesByRegion(region: EuropeanRegion): EuropeanCity[] {
  return EUROPEAN_CITIES.filter((c) => c.region === region);
}

export function getCityById(id: string): EuropeanCity | undefined {
  return EUROPEAN_CITIES.find((c) => c.id === id);
}
