/**
 * Rest areas and overnight stops along major European corridors
 */

export interface RestArea {
  id: string;
  name: string;
  location: string;
  corridor: string;
  country: string;
  facilities: string[];
  coords: { lng: number; lat: number };
  notes?: string;
}

export const EUROPEAN_REST_AREAS: RestArea[] = [
  // Германия — Австрия
  {
    id: "rasthof-walserberg",
    name: "Rasthof Walserberg",
    location: "A1, граница DE-AT",
    corridor: "munich-sofia",
    country: "Австрия",
    facilities: ["parking", "toilet", "restaurant", "fuel", "shower"],
    coords: { lng: 12.989, lat: 47.793 },
    notes: "Идеална спирка преди/след границата DE-AT.",
  },
  {
    id: "rasthof-vocklabruck",
    name: "Rasthof Vöcklabruck",
    location: "A1, Австрия",
    corridor: "munich-sofia",
    country: "Австрия",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 13.658, lat: 48.009 },
  },
  // Унгария
  {
    id: "mol-m1-gyor",
    name: "MOL M1 Győr",
    location: "M1, Унгария",
    corridor: "munich-sofia",
    country: "Унгария",
    facilities: ["parking", "toilet", "restaurant", "fuel", "wifi"],
    coords: { lng: 17.635, lat: 47.687 },
    notes: "Голяма зона за почивка на пътя към Будапеща.",
  },
  {
    id: "m7-balaton",
    name: "M7 Balaton",
    location: "M7, езеро Балатон",
    corridor: "munich-sofia",
    country: "Унгария",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 17.75, lat: 46.92 },
  },
  // Сърбия
  {
    id: "nis-jug",
    name: "АМ Ниш — юг",
    location: "E75, Ниш",
    corridor: "munich-sofia",
    country: "Сърбия",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 21.9, lat: 43.32 },
    notes: "Ключова спирка преди границата с България.",
  },
  // България
  {
    id: "motelia-trakia",
    name: "Мотел Тракия",
    location: "АМ Тракия, км 120",
    corridor: "athens-sofia",
    country: "България",
    facilities: ["parking", "toilet", "restaurant", "wifi"],
    coords: { lng: 24.2, lat: 42.3 },
  },
  {
    id: "hemus-rest",
    name: "Почивна станция Хемус",
    location: "АМ Хемус, км 85",
    corridor: "bucharest-sofia",
    country: "България",
    facilities: ["parking", "toilet", "restaurant"],
    coords: { lng: 23.8, lat: 42.8 },
  },
  {
    id: "motel-e80",
    name: "Motel E-80",
    location: "Е-80, близо до Сливница",
    corridor: "munich-sofia",
    country: "България",
    facilities: ["parking", "toilet", "shower", "restaurant", "fuel"],
    coords: { lng: 23.0, lat: 42.7 },
  },
  // Западна Европа
  {
    id: "aire-de-reims",
    name: "Aire de Reims",
    location: "A4, Франция",
    corridor: "paris-sofia",
    country: "Франция",
    facilities: ["parking", "toilet", "restaurant", "fuel", "ev_charging"],
    coords: { lng: 4.03, lat: 49.26 },
  },
  {
    id: "rasthof-koln",
    name: "Rasthof Köln-Ost",
    location: "A3, Германия",
    corridor: "london-sofia",
    country: "Германия",
    facilities: ["parking", "toilet", "restaurant", "fuel", "shower", "wifi"],
    coords: { lng: 7.05, lat: 50.96 },
  },
  {
    id: "calais-port",
    name: "Calais Port Area",
    location: "Кале, Франция",
    corridor: "london-sofia",
    country: "Франция",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 1.858, lat: 50.951 },
    notes: "Преди Eurotunnel / паром към Великобритания.",
  },
  // Гърция
  {
    id: "thessaloniki-ring",
    name: "Почивна зона Солун",
    location: "E90, Солун",
    corridor: "athens-sofia",
    country: "Гърция",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 22.95, lat: 40.64 },
  },
];

export function getRestAreasForCorridor(corridorId: string): RestArea[] {
  return EUROPEAN_REST_AREAS.filter((a) => a.corridor === corridorId);
}

export function getRestAreasByCountry(country: string): RestArea[] {
  return EUROPEAN_REST_AREAS.filter((a) => a.country === country);
}
