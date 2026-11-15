/**
 * Deterministic trip-planner tools. None of these call the network.
 * Stage 3 can wrap each export as an LLM tool. `runTripPlan` is the
 * server orchestrator and lives in `./run-plan`.
 */

export { fuelWindows } from "@/lib/planner/fuel-windows";
export { mergeDrivingBreaks } from "@/lib/planner/breaks";
export {
  selectCandidateBorders,
  scoreBorderOptions,
} from "@/lib/planner/borders";
export { communityAlongRoute } from "@/lib/planner/community";
export { chooseStation, classifyPlace } from "@/lib/planner/stations";
export { expectedWait } from "@/lib/planner/wait";
export {
  planNakordoniRefresh,
  buildCorridorRefreshJobs,
  isLicensedCheckpointOrigin,
  multiCallUnits,
} from "@/lib/planner/nakordoni-budget";
export { resolveVehicle } from "@/lib/planner/vehicle";
export { assembleTripPlan } from "@/lib/planner/assemble";
export {
  DEFAULT_TRIP_PREFERENCES,
  resolveTripPreferences,
  detourLimitKm,
  effectiveBreakEveryMin,
  drivingDayLimits,
  costingFromPreferences,
} from "@/lib/planner/preferences";
export { flagBias, aggregateFlags } from "@/lib/planner/flag-score";
export { buildChecklist } from "@/lib/planner/checklist";
export { whyThisRoute } from "@/lib/planner/why-route";
export { buildFuelAdvice } from "@/lib/fuel-prices/advice";
