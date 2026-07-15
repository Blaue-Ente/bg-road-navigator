import type { GeoPoint } from "@/types/route.types";

export interface BorderStatus {
  crossing_id: string;
  name_bg: string;
  name_en: string;
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
  data_source?: "nakordoni" | "estimate";
  region?: string;
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
