export type DelayCategory = 
  | "ACCIDENT" 
  | "ROAD_WORKS" 
  | "WEATHER" 
  | "CONGESTION" 
  | "CLOSURE" 
  | "OTHER";

export function classifyDelayReason(reason: string): DelayCategory {
  const normalized = reason.toUpperCase().trim();
  
  switch (normalized) {
    case "ACCIDENT":
      return "ACCIDENT";
    case "ROAD_WORKS":
    case "CONSTRUCTION":
      return "ROAD_WORKS";
    case "WEATHER":
    case "SNOW":
    case "RAIN":
    case "FLOOD":
      return "WEATHER";
    case "CONGESTION":
    case "TRAFFIC_JAM":
      return "CONGESTION";
    case "CLOSURE":
    case "ROAD_CLOSED":
      return "CLOSURE";
    default:
      return "OTHER";
  }
}