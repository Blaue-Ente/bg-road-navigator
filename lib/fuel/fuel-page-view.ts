export type FuelListStatus = "ok" | "error" | "degraded";

export interface FuelPageViewInput {
  fetchStatus: "loading" | "error" | "ok";
  stationCount: number;
  degraded?: boolean;
}

export type FuelEmptyCopyKey = "noneHere" | "unavailable";

export interface FuelPageViewModel {
  listStatus: FuelListStatus;
  emptyCopyKey: FuelEmptyCopyKey | null;
  showRetry: boolean;
  showPlanLink: boolean;
}

export function fuelPageViewModel(input: FuelPageViewInput): FuelPageViewModel {
  if (input.fetchStatus === "error") {
    return {
      listStatus: "error",
      emptyCopyKey: "unavailable",
      showRetry: true,
      showPlanLink: true,
    };
  }
  if (input.stationCount === 0) {
    return {
      listStatus: input.degraded ? "degraded" : "ok",
      emptyCopyKey: input.degraded ? "unavailable" : "noneHere",
      showRetry: true,
      showPlanLink: true,
    };
  }
  return {
    listStatus: input.degraded ? "degraded" : "ok",
    emptyCopyKey: null,
    showRetry: false,
    showPlanLink: false,
  };
}

export function fuelPageUsesBulgariaSubtitle(
  mode: "route" | "bbox" | "default" | undefined,
  centerLat: number,
  centerLng: number
): boolean {
  if (mode === "route") return false;
  return centerLat >= 41.2 && centerLat <= 44.3 && centerLng >= 22 && centerLng <= 29.5;
}