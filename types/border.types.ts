import type { BorderDocument } from "@/lib/constants/border-crossings";
import type { Localized, LocalizedMap } from "@/lib/i18n/localized-field";
import type { GeoPoint } from "@/types/route.types";

export interface BorderStatus {
  crossing_id: string;
  name_bg: string;
  name_en: string;
  name_i18n?: LocalizedMap;
  country_pair: string;
  coords?: GeoPoint;
  wait_time_cars: number;
  wait_time_trucks: number;
  wait_time_buses: number;
  avg_wait_by_hour: number[];
  working_hours: string;
  status: "green" | "yellow" | "orange" | "red";
  last_updated: string;
  queue_length?: number;
  nakordoni_url?: string;
  nakordoni_ppid?: string;
  data_source?: "nakordoni" | "estimate" | "hatarinfo";
  region?: string;
  accepted_documents?: string[];
  document_codes?: BorderDocument[];
  notes_bg?: string;
  notes_i18n?: Localized;
  vehicle_types_allowed?: string[];
  /** Truck/bus waits are derived when Nakordoni does not publish them. */
  derived_heavy_wait?: boolean;
  /** What drivers who just crossed reported (middle value of the last hours). */
  driver_reports?: { minutes: number; count: number; latest_at: string };
}

export interface BorderWebcamFeed {
  crossing_id: string;
  label: string;
  image_url: string | null;
  player_url: string | null;
  nakordoni_url: string | null;
  windy_url: string | null;
  source: "windy" | "nakordoni" | "none";
  attribution: string;
}
