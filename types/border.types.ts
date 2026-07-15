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
  webcam_urls?: string[];
}
