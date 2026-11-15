import type {
  CurrentQueue,
  DayStatsMatrix,
  ForecastPoint,
} from "@/lib/planner/wait";

export interface ParsedQueue extends CurrentQueue {
  ppid: string;
  name: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseObservedAt(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const text = str(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function quality(value: unknown): "high" | "low" | null {
  if (value === "high" || value === "low") return value;
  return null;
}

function queueFromBlock(ppid: string, block: unknown): ParsedQueue | null {
  if (!isRecord(block)) return null;
  const queue = isRecord(block.queue) ? block.queue : block;
  const update = isRecord(block.update_info) ? block.update_info : null;
  const waitMin =
    num(queue.wait_min) ?? num(queue.wait) ?? num(queue.wait_time);
  const queueNow =
    num(queue.queue_now) ?? num(queue.queue) ?? num(update?.queue_now);
  if (waitMin == null && queueNow == null) return null;
  const observedAt =
    parseObservedAt(update?.datetime) ??
    parseObservedAt(update?.timestamp) ??
    parseObservedAt(queue.updated_at) ??
    parseObservedAt(queue.time);
  return {
    ppid,
    name: str(queue.name),
    waitMin,
    queueNow,
    quality: quality(queue.data_quality) ?? quality(update?.data_quality),
    observedAt,
    ageMin: num(update?.age_minutes) ?? num(queue.age_min),
  };
}

/** Multi payload is an object keyed by ppid. An array is accepted for older bodies. */
export function parseMultiQueues(payload: unknown): ParsedQueue[] {
  const data = envelopeData(payload);
  const rows: ParsedQueue[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (!isRecord(item)) continue;
      const ppid = str(item.ppid);
      if (!ppid) continue;
      const parsed = queueFromBlock(ppid, item);
      if (parsed) rows.push(parsed);
    }
    return rows;
  }
  if (!isRecord(data)) return [];
  for (const [ppid, block] of Object.entries(data)) {
    if (!ppid.startsWith("id_")) continue;
    const parsed = queueFromBlock(ppid, block);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

export function parseForecast(payload: unknown): ForecastPoint[] {
  const data = envelopeData(payload);
  const list = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.points)
      ? data.points
      : isRecord(data) && Array.isArray(data.forecast)
        ? data.forecast
        : [];
  const points: ForecastPoint[] = [];
  for (const item of list) {
    if (!isRecord(item)) continue;
    const waitMin = num(item.wait_min) ?? num(item.wait) ?? num(item.wait_time);
    const queue = num(item.queue) ?? num(item.queue_now) ?? num(item.avg_cars);
    if (waitMin == null && queue == null) continue;
    points.push({
      at:
        parseObservedAt(item.time) ??
        parseObservedAt(item.dt) ??
        parseObservedAt(item.datetime),
      hour: num(item.hour),
      waitMin,
      queue,
    });
  }
  return points;
}

export function parseDayStats(payload: unknown): DayStatsMatrix | null {
  const data = envelopeData(payload);
  if (!isRecord(data) || !Array.isArray(data.matrix)) return null;
  const matrix = data.matrix.map((row) =>
    Array.isArray(row) ? row.map((cell) => num(cell) ?? Number.NaN) : []
  );
  if (matrix.length < 7) return null;
  const generated = num(data.generated_at);
  return {
    timeZone: str(data.tz) ?? str(data.timezone) ?? "Europe/Sofia",
    matrix,
    quality: quality(data.data_quality),
    generatedAt:
      generated == null
        ? null
        : new Date(
            generated > 1e12 ? generated : generated * 1000
          ).toISOString(),
  };
}

export function parseBorderQueues(payload: unknown): ParsedQueue[] {
  const data = envelopeData(payload);
  const list = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.checkpoints)
      ? data.checkpoints
      : isRecord(data) && Array.isArray(data.items)
        ? data.items
        : [];
  const rows: ParsedQueue[] = [];
  for (const item of list) {
    if (!isRecord(item)) continue;
    const ppid = str(item.ppid) ?? str(item.id);
    if (!ppid) continue;
    const parsed = queueFromBlock(ppid, item);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

/** Directory rows used to drop a checkpoint whose origin country is not licensed. */
export function parseDirectoryOrigins(
  payload: unknown
): Array<{ ppid: string; origin: number | null }> {
  const data = envelopeData(payload);
  const list =
    isRecord(data) && Array.isArray(data.checkpoints)
      ? data.checkpoints
      : Array.isArray(data)
        ? data
        : [];
  const rows: Array<{ ppid: string; origin: number | null }> = [];
  for (const item of list) {
    if (!isRecord(item)) continue;
    const ppid = str(item.ppid);
    if (!ppid) continue;
    rows.push({ ppid, origin: num(item.origin) });
  }
  return rows;
}

function envelopeData(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  if ("ok" in payload && payload.ok === false) return null;
  if ("data" in payload) return payload.data;
  return payload;
}
