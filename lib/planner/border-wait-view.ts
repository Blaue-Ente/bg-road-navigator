import type { NakordoniAttribution, WaitEstimate, WaitSource } from "@/lib/planner/types";

/** What the plan sheet may say about one crossing. Unlicensed rows never credit Nakordoni. */
export interface BorderWaitView {
  unlicensed: boolean;
  minutes: number;
  trafficDelayMin: number | null;
  source: WaitSource;
  detail: string | null;
  ageLabel: string | null;
  attribution: NakordoniAttribution | null;
}

export function borderWaitView(wait: WaitEstimate): BorderWaitView {
  if (wait.unlicensed_market === true) {
    return {
      unlicensed: true,
      minutes: wait.minutes,
      trafficDelayMin: finiteDelay(wait.traffic_delay_min),
      source: wait.source,
      detail: null,
      ageLabel: null,
      attribution: null,
    };
  }
  return {
    unlicensed: false,
    minutes: wait.minutes,
    trafficDelayMin: null,
    source: wait.source,
    detail: wait.label_bg,
    ageLabel: wait.age_label,
    attribution: wait.attribution,
  };
}

function finiteDelay(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value);
}
