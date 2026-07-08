/**
 * BG Road Navigator - Border Crossing Definitions
 * All 12 Bulgarian border crossings with complete metadata
 */

export interface BorderCrossing {
  id: string;
  name_bg: string;
  name_en: string;
  country_pair: string;
  coords: { lng: number; lat: number };
  webcam_urls: string[];
  typical_wait_minutes: number[]; // [0..23] - average wait by hour of day
  working_hours: string;
  accepted_documents: string[];
  vehicle_types_allowed: string[];
  notes_bg: string;
}

export const BORDER_CROSSINGS: BorderCrossing[] = [
  {
    id: "kalotina",
    name_bg: "Калотина",
    name_en: "Kalotina",
    country_pair: "BG - RS",
    coords: { lng: 22.8969, lat: 42.9833 },
    webcam_urls: ["https://webcam.kalotina.bg/live.jpg"],
    typical_wait_minutes: [15, 15, 15, 15, 15, 15, 20, 25, 30, 35, 40, 35, 30, 25, 20, 20, 20, 25, 30, 35, 30, 25, 20, 18],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Най-голямата граница между България и Сърбия. Често има големи опашки през уикендите."
  },
  {
    id: "kulata",
    name_bg: "Кулата",
    name_en: "Kulata",
    country_pair: "BG - GR",
    coords: { lng: 23.7781, lat: 41.3972 },
    webcam_urls: ["https://webcam.kulata.bg/live.jpg"],
    typical_wait_minutes: [20, 20, 20, 20, 20, 20, 25, 30, 35, 40, 45, 40, 35, 30, 25, 25, 25, 30, 35, 40, 35, 30, 25, 22],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Основната граница към Гърция. Висок трафик през лятото."
  },
  {
    id: "kapitan-andreevo",
    name_bg: "Капитан Андреево",
    name_en: "Kapitan Andreevo",
    country_pair: "BG - TR",
    coords: { lng: 26.3056, lat: 41.8833 },
    webcam_urls: ["https://webcam.kapitan-andreevo.bg/live.jpg"],
    typical_wait_minutes: [30, 30, 30, 30, 30, 35, 40, 50, 60, 75, 90, 75, 60, 45, 40, 35, 35, 40, 50, 60, 50, 40, 35, 32],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза (за някои националности)"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Най-натоварената граница с Турция. Дълги опашки през сезона."
  },
  {
    id: "danube-bridge-vidin",
    name_bg: "Дунав мост Видин",
    name_en: "Danube Bridge Vidin",
    country_pair: "BG - RO",
    coords: { lng: 22.8806, lat: 43.9928 },
    webcam_urls: ["https://webcam.vidin-bridge.bg/live.jpg"],
    typical_wait_minutes: [25, 25, 25, 25, 25, 25, 30, 35, 40, 45, 50, 45, 40, 35, 30, 30, 30, 35, 40, 45, 40, 35, 30, 27],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Мост над Дунав към Румъния. Важна връзка с Централна Европа."
  },
  {
    id: "danube-bridge-ruse",
    name_bg: "Дунав мост Русе",
    name_en: "Danube Bridge Ruse",
    country_pair: "BG - RO",
    coords: { lng: 25.9714, lat: 43.8992 },
    webcam_urls: ["https://webcam.ruse-bridge.bg/live.jpg"],
    typical_wait_minutes: [28, 28, 28, 28, 28, 28, 32, 38, 45, 50, 55, 50, 45, 40, 35, 35, 35, 40, 45, 50, 45, 40, 35, 30],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Вторият мост над Дунав. Свързва Русе с Джурджу."
  },
  {
    id: "gyueshevo",
    name_bg: "Гюешево",
    name_en: "Gyueshevo",
    country_pair: "BG - MK",
    coords: { lng: 22.5167, lat: 42.2167 },
    webcam_urls: ["https://webcam.gyueshevo.bg/live.jpg"],
    typical_wait_minutes: [20, 20, 20, 20, 20, 20, 22, 25, 30, 35, 40, 35, 30, 25, 22, 22, 22, 25, 30, 35, 30, 25, 22, 20],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Граничен пункт към Северна Македония. Планински път."
  },
  {
    id: "zlatarevo",
    name_bg: "Златарево",
    name_en: "Zlatarevo",
    country_pair: "BG - MK",
    coords: { lng: 23.0667, lat: 41.4667 },
    webcam_urls: ["https://webcam.zlatarevo.bg/live.jpg"],
    typical_wait_minutes: [18, 18, 18, 18, 18, 18, 20, 24, 28, 32, 36, 32, 28, 24, 20, 20, 20, 24, 28, 32, 28, 24, 20, 18],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "По-малка граница към Северна Македония. По-малко натоварване."
  },
  {
    id: "ilinden",
    name_bg: "Илинден",
    name_en: "Ilinden",
    country_pair: "BG - MK",
    coords: { lng: 23.3386, lat: 41.5167 },
    webcam_urls: ["https://webcam.ilinden.bg/live.jpg"],
    typical_wait_minutes: [22, 22, 22, 22, 22, 22, 25, 30, 35, 40, 45, 40, 35, 30, 25, 25, 25, 30, 35, 40, 35, 30, 25, 22],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Най-новата граница с Македония. Добра алтернатива на Кулата."
  },
  {
    id: "promachon",
    name_bg: "Промахон",
    name_en: "Promachon",
    country_pair: "BG - GR",
    coords: { lng: 23.3639, lat: 41.5167 },
    webcam_urls: ["https://webcam.promachon.bg/live.jpg"],
    typical_wait_minutes: [25, 25, 25, 25, 25, 25, 28, 35, 40, 45, 50, 45, 40, 35, 28, 28, 28, 35, 40, 45, 40, 35, 28, 25],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Алтернатива на Кулата за Гърция. По-малко натоварване."
  },
  {
    id: "makaza",
    name_bg: "Маказа",
    name_en: "Makaza",
    country_pair: "BG - GR",
    coords: { lng: 25.3833, lat: 41.0833 },
    webcam_urls: ["https://webcam.makaza.bg/live.jpg"],
    typical_wait_minutes: [20, 20, 20, 20, 20, 20, 22, 28, 32, 38, 42, 38, 32, 28, 22, 22, 22, 28, 32, 38, 32, 28, 22, 20],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Нова граница в Източните Родопи. Добра за Южна България."
  },
  {
    id: "malko-tarnovo",
    name_bg: "Малко Търново",
    name_en: "Malko Tarnovo",
    country_pair: "BG - TR",
    coords: { lng: 27.5167, lat: 42.0333 },
    webcam_urls: ["https://webcam.malko-tarnovo.bg/live.jpg"],
    typical_wait_minutes: [30, 30, 30, 30, 30, 35, 40, 50, 60, 70, 80, 70, 60, 50, 45, 40, 40, 50, 60, 70, 60, 50, 45, 35],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза (за някои националности)"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Граничен пункт в Странджа. По-малко натоварване от Капитан Андреево."
  },
  {
    id: "lesovo",
    name_bg: "Лесово",
    name_en: "Lesovo",
    country_pair: "BG - TR",
    coords: { lng: 26.9333, lat: 42.1167 },
    webcam_urls: ["https://webcam.lesovo.bg/live.jpg"],
    typical_wait_minutes: [28, 28, 28, 28, 28, 32, 38, 48, 58, 68, 78, 68, 58, 48, 42, 38, 38, 48, 58, 68, 58, 48, 42, 33],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза (за някои националности)"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: "Нова граница с Турция. Добра алтернатива на Капитан Андреево."
  }
];