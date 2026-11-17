import type { PoiIcon } from "@/lib/map/poi-icons";
import type { TrafficIncident } from "@/types/traffic.types";

export type TrafficKind = TrafficIncident["type"];
/** What a driver can switch on and off together. */
export type TrafficGroup = "crashes" | "closures" | "works" | "slowdowns";

export const TRAFFIC_GROUPS: TrafficGroup[] = ["crashes", "closures", "works", "slowdowns"];

export interface TrafficKindStyle {
  icon: PoiIcon;
  color: string;
  group: TrafficGroup;
}

/** One pictogram and colour per kind of event, so they can be told apart at a glance. */
export const TRAFFIC_KIND_STYLE: Record<TrafficKind, TrafficKindStyle> = {
  accident: { icon: "siren", color: "#C0392B", group: "crashes" },
  hazard: { icon: "alert", color: "#EA580C", group: "crashes" },
  road_closure: { icon: "ban", color: "#7F1D1D", group: "closures" },
  lane_restriction: { icon: "lanes", color: "#B45309", group: "closures" },
  construction: { icon: "cone", color: "#F59E0B", group: "works" },
  congestion: { icon: "car", color: "#8E44AD", group: "slowdowns" },
  weather: { icon: "cloud", color: "#2563EB", group: "slowdowns" },
  other: { icon: "info", color: "#6B7280", group: "slowdowns" },
};

/** Which kinds each group holds, in legend order. */
export const TRAFFIC_GROUP_KINDS: Record<TrafficGroup, TrafficKind[]> = {
  crashes: ["accident", "hazard"],
  closures: ["road_closure", "lane_restriction"],
  works: ["construction"],
  slowdowns: ["congestion", "weather", "other"],
};

/** Pin size by how serious the event is. */
export function trafficPinSize(severity: TrafficIncident["severity"]): number {
  return severity === "critical" ? 34 : severity === "major" ? 30 : 26;
}
