/**
 * Favorite routes keep origin, destination, and preferences in columns.
 * `plan` may be a previous TripPlannerResult or this envelope, which also
 * stores the optional via, departure, and fuel level. No new column.
 */
export const FAVORITE_PLAN_KIND = "bg-road-favorite-v1";

export interface FavoritePlanInputs {
  via: Array<{ label: string; lng: number; lat: number }>;
  depart_at: string | null;
  fuel_level: number;
}

export interface FavoritePlanEnvelope {
  kind: typeof FAVORITE_PLAN_KIND;
  inputs: FavoritePlanInputs;
  result: unknown;
}

export function buildFavoriteEnvelope(
  inputs: FavoritePlanInputs,
  result: unknown
): FavoritePlanEnvelope {
  return {
    kind: FAVORITE_PLAN_KIND,
    inputs: {
      via: sanitizeVia(inputs.via),
      depart_at: inputs.depart_at,
      fuel_level: clampFuel(inputs.fuel_level),
    },
    result: stripRouteOptionGeometry(result),
  };
}

/** The turn list is large and only useful live, so saved favorites drop it. */
function withoutManeuvers(
  record: Record<string, unknown>
): Record<string, unknown> {
  const route = record.route;
  if (!route || typeof route !== "object") return record;
  const { maneuvers: _drop, ...rest } = route as Record<string, unknown>;
  void _drop;
  return { ...record, route: rest };
}

function stripRouteOptionGeometry(result: unknown): unknown {
  if (!result || typeof result !== "object") return result ?? null;
  const record = withoutManeuvers(result as Record<string, unknown>);
  if (record.planner !== "deterministic") return record;
  const options = record.route_options;
  if (!options || typeof options !== "object") return record;
  const block = options as Record<string, unknown>;
  const alt = block.alternative;
  if (!alt || typeof alt !== "object") return record;
  return {
    ...record,
    route_options: {
      ...block,
      alternative: {
        ...(alt as Record<string, unknown>),
        geometry: { type: "LineString", coordinates: [] },
      },
    },
  };
}

export function readFavoriteEnvelope(plan: unknown): {
  inputs: FavoritePlanInputs | null;
  result: unknown;
} {
  if (!plan || typeof plan !== "object") {
    return { inputs: null, result: null };
  }
  const record = plan as Record<string, unknown>;
  if (record.kind === FAVORITE_PLAN_KIND) {
    const inputs = record.inputs;
    return {
      inputs: readInputs(inputs),
      result: record.result ?? null,
    };
  }
  if (record.planner === "deterministic") {
    return { inputs: null, result: plan };
  }
  return { inputs: null, result: null };
}

function readInputs(value: unknown): FavoritePlanInputs | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const depart = record.depart_at;
  const fuel = record.fuel_level;
  return {
    via: sanitizeVia(record.via),
    depart_at: typeof depart === "string" ? depart : null,
    fuel_level: typeof fuel === "number" ? clampFuel(fuel) : 0.8,
  };
}

function sanitizeVia(value: unknown): FavoritePlanInputs["via"] {
  if (!Array.isArray(value)) return [];
  const out: FavoritePlanInputs["via"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const point = item as Record<string, unknown>;
    if (typeof point.label !== "string" || !point.label.trim()) continue;
    if (typeof point.lng !== "number" || typeof point.lat !== "number") continue;
    if (!Number.isFinite(point.lng) || !Number.isFinite(point.lat)) continue;
    out.push({
      label: point.label.trim().slice(0, 160),
      lng: point.lng,
      lat: point.lat,
    });
    if (out.length === 3) break;
  }
  return out;
}

function clampFuel(value: number): number {
  if (!Number.isFinite(value)) return 0.8;
  return Math.min(1, Math.max(0.05, value));
}
