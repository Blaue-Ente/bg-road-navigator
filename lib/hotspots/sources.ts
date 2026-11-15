import { CHERNA_PISTA_ATTRIBUTION } from "@/lib/hazards/cherna-pista";
import { MVR_ATTRIBUTION } from "@/lib/hotspots/mvr";

export interface HotspotSource {
  id: string;
  country: string;
  label_bg: string;
  /** Shown in the map credits and on the plan. */
  attribution: string;
  /** A pending source stays out of the credits until its file is ingested. */
  pending: boolean;
}

const DATASET_RS =
  "https://data.gov.rs/sr/datasets/podatsi-o-saobratshajnim-nezgodama-po-politsijskim-upravama-i-opshtinama/";

export const HOTSPOT_DOWNLOAD_DATE = "2026-11-15";

export const HOTSPOT_SOURCES: HotspotSource[] = [
  {
    id: "rs-mup",
    country: "RS",
    label_bg: "МВР на Сърбия",
    attribution: `Източник: МУП (MUP), data.gov.rs, ${DATASET_RS}, изтеглено на ${HOTSPOT_DOWNLOAD_DATE}, данните са обработени. Serbian Open Data Licence.`,
    pending: false,
  },
  {
    id: "de-unfallatlas",
    country: "DE",
    label_bg: "Unfallatlas",
    attribution:
      "Quelle: Statistische Ämter des Bundes und der Länder, Unfallatlas, dl-de/by-2-0, Daten geändert",
    pending: false,
  },
  {
    id: "hu-ksh",
    country: "HU",
    label_bg: "KSH",
    attribution: "Forrás: KSH (ksh.hu), CC BY 4.0. Alapadatok: ORFK",
    pending: false,
  },
  {
    id: "at-statistik",
    country: "AT",
    label_bg: "Statistik Austria",
    attribution: "Datenquelle: Statistik Austria — data.statistik.gv.at",
    pending: false,
  },
  {
    id: "cz-police",
    country: "CZ",
    label_bg: "Полиция на Чехия",
    attribution: "Zdroj: Policie ČR",
    pending: false,
  },
  {
    id: "bg-cherna",
    country: "BG",
    label_bg: "Черна писта",
    attribution: CHERNA_PISTA_ATTRIBUTION,
    pending: false,
  },
  {
    id: "bg-mvr",
    country: "BG",
    label_bg: "МВР",
    attribution: MVR_ATTRIBUTION,
    pending: false,
  },
];

const BY_ID = new Map(HOTSPOT_SOURCES.map((source) => [source.id, source]));

export function hotspotSource(id: string): HotspotSource | null {
  return BY_ID.get(id) ?? null;
}

export function attributionsFor(sourceIds: Iterable<string>): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const id of sourceIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const source = BY_ID.get(id);
    if (source && !source.pending) lines.push(source.attribution);
  }
  return lines;
}
