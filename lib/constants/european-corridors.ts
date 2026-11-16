/**
 * Popular long-haul corridors for Bulgarian travelers across Europe
 */

import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";
import { bucharestSofiaCorridorDescription } from "@/lib/constants/border-crossings";

export interface TravelCorridor {
  id: string;
  cityIds: string[];
  borderIds: string[];
  estimatedHours: number;
}

export const TRAVEL_CORRIDORS: TravelCorridor[] = [
  {
    id: "london-sofia",
    cityIds: [
      "london",
      "brussels",
      "cologne",
      "frankfurt",
      "munich",
      "vienna",
      "budapest",
      "belgrade",
      "sofia",
    ],
    borderIds: [
      "calais",
      "kehl-strasbourg",
      "suben",
      "nickelsdorf",
      "batrovci",
      "kalotina",
    ],
    estimatedHours: 32,
  },
  {
    id: "berlin-sofia",
    cityIds: ["berlin", "prague", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: [
      "frankfurt-oder",
      "suben",
      "nickelsdorf",
      "batrovci",
      "kalotina",
    ],
    estimatedHours: 18,
  },
  {
    id: "munich-sofia",
    cityIds: ["munich", "vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["suben", "nickelsdorf", "batrovci", "kalotina"],
    estimatedHours: 13,
  },
  {
    id: "paris-sofia",
    cityIds: [
      "paris",
      "brussels",
      "cologne",
      "frankfurt",
      "munich",
      "vienna",
      "budapest",
      "belgrade",
      "sofia",
    ],
    borderIds: [
      "kehl-strasbourg",
      "suben",
      "nickelsdorf",
      "batrovci",
      "kalotina",
    ],
    estimatedHours: 22,
  },
  {
    id: "amsterdam-sofia",
    cityIds: [
      "amsterdam",
      "cologne",
      "frankfurt",
      "munich",
      "vienna",
      "budapest",
      "belgrade",
      "sofia",
    ],
    borderIds: [
      "kehl-strasbourg",
      "suben",
      "nickelsdorf",
      "batrovci",
      "kalotina",
    ],
    estimatedHours: 24,
  },
  {
    id: "madrid-sofia",
    cityIds: [
      "madrid",
      "barcelona",
      "lyon",
      "frankfurt",
      "munich",
      "vienna",
      "budapest",
      "belgrade",
      "sofia",
    ],
    borderIds: [
      "mont-blanc",
      "kehl-strasbourg",
      "suben",
      "nickelsdorf",
      "batrovci",
      "kalotina",
    ],
    estimatedHours: 36,
  },
  {
    id: "barcelona-sofia",
    cityIds: [
      "barcelona",
      "lyon",
      "frankfurt",
      "munich",
      "vienna",
      "budapest",
      "belgrade",
      "sofia",
    ],
    borderIds: [
      "mont-blanc",
      "kehl-strasbourg",
      "suben",
      "nickelsdorf",
      "batrovci",
      "kalotina",
    ],
    estimatedHours: 28,
  },
  {
    id: "milan-sofia",
    cityIds: ["milan", "ljubljana", "zagreb", "belgrade", "sofia"],
    borderIds: ["chiasso", "gorizia", "obrezje", "bajakovo", "kalotina"],
    estimatedHours: 16,
  },
  {
    id: "zagreb-sofia",
    cityIds: ["zagreb", "belgrade", "sofia"],
    borderIds: ["bajakovo", "kalotina"],
    estimatedHours: 9,
  },
  {
    id: "vienna-sofia",
    cityIds: ["vienna", "budapest", "belgrade", "sofia"],
    borderIds: ["nickelsdorf", "horgos", "kalotina"],
    estimatedHours: 11,
  },
  {
    id: "prague-sofia",
    cityIds: ["prague", "bratislava", "budapest", "belgrade", "sofia"],
    borderIds: ["komarno", "horgos", "kalotina"],
    estimatedHours: 14,
  },
  {
    id: "stockholm-sofia",
    cityIds: [
      "stockholm",
      "copenhagen",
      "hamburg",
      "berlin",
      "prague",
      "vienna",
      "budapest",
      "belgrade",
      "sofia",
    ],
    borderIds: [
      "frankfurt-oder",
      "suben",
      "nickelsdorf",
      "batrovci",
      "kalotina",
    ],
    estimatedHours: 40,
  },
  {
    id: "athens-sofia",
    cityIds: ["athens", "thessaloniki", "sofia"],
    borderIds: ["kulata", "promachon"],
    estimatedHours: 8,
  },
  {
    id: "istanbul-sofia",
    cityIds: ["istanbul", "sofia"],
    borderIds: ["kapitan-andreevo", "lesovo"],
    estimatedHours: 6,
  },
  {
    id: "bucharest-sofia",
    cityIds: ["bucharest", "ruse", "sofia"],
    borderIds: ["danube-bridge-ruse", "danube-bridge-vidin"],
    estimatedHours: 5,
  },
  {
    id: "milan-athens",
    cityIds: [
      "milan",
      "zagreb",
      "belgrade",
      "skopje",
      "thessaloniki",
      "athens",
    ],
    borderIds: ["gorizia", "batrovci", "presevo", "kulata"],
    estimatedHours: 20,
  },
  {
    id: "sofia-london",
    cityIds: [
      "sofia",
      "belgrade",
      "budapest",
      "vienna",
      "munich",
      "frankfurt",
      "brussels",
      "london",
    ],
    borderIds: ["kalotina", "batrovci", "nickelsdorf", "suben", "calais"],
    estimatedHours: 32,
  },
  {
    id: "sofia-munich",
    cityIds: ["sofia", "belgrade", "budapest", "vienna", "munich"],
    borderIds: ["kalotina", "horgos", "nickelsdorf", "suben"],
    estimatedHours: 13,
  },
];

type CorridorCopyKey = keyof ReturnType<typeof catalog>["corridors"];

export function corridorLabel(
  corridorId: string,
  locale: Locale = "bg"
): string {
  const block = catalog(locale).corridors[corridorId as CorridorCopyKey];
  return block?.label ?? corridorId;
}

export function corridorDescription(
  corridorId: string,
  locale: Locale = "bg"
): string {
  if (corridorId === "bucharest-sofia" && locale !== "bg") {
    return bucharestSofiaCorridorDescription(locale);
  }
  const block = catalog(locale).corridors[corridorId as CorridorCopyKey];
  return block?.description ?? "";
}