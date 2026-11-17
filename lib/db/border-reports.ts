import { and, desc, gt, inArray, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { borderWaitReports } from "@/lib/db/schema";

export interface DriverReportSummary {
  /** Middle value of the recent reports, so one odd number does not decide. */
  minutes: number;
  count: number;
  latest_at: string;
}

/** Reports older than this are not shown: a border changes in a few hours. */
export const REPORT_WINDOW_MS = 3 * 3_600_000;
/** One driver can report a crossing once in this long. */
export const REPORT_COOLDOWN_MS = 30 * 60_000;

export class ReportTooSoonError extends Error {
  constructor() {
    super("A report for this crossing was sent a moment ago");
    this.name = "ReportTooSoonError";
  }
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function summarize(
  rows: Array<{ crossingId: string; minutes: number; reportedAt: Date }>
): Map<string, DriverReportSummary> {
  const byCrossing = new Map<string, typeof rows>();
  for (const row of rows) {
    byCrossing.set(row.crossingId, [...(byCrossing.get(row.crossingId) ?? []), row]);
  }
  const out = new Map<string, DriverReportSummary>();
  for (const [id, list] of byCrossing) {
    out.set(id, {
      minutes: median(list.map((row) => row.minutes)),
      count: list.length,
      latest_at: new Date(
        Math.max(...list.map((row) => row.reportedAt.getTime()))
      ).toISOString(),
    });
  }
  return out;
}

export async function insertBorderReport(
  input: {
    userId: string;
    crossingId: string;
    minutes: number;
    source: "auto" | "manual";
    reliable: boolean;
    fromCountry: string | null;
    toCountry: string | null;
    startedAt: Date | null;
  },
  now = new Date()
): Promise<void> {
  const db = getDb();
  const recent = await db
    .select({ id: borderWaitReports.id })
    .from(borderWaitReports)
    .where(
      and(
        eq(borderWaitReports.userId, input.userId),
        eq(borderWaitReports.crossingId, input.crossingId),
        gt(borderWaitReports.reportedAt, new Date(now.getTime() - REPORT_COOLDOWN_MS))
      )
    )
    .limit(1);
  if (recent.length > 0) throw new ReportTooSoonError();
  await db.insert(borderWaitReports).values({
    crossingId: input.crossingId,
    userId: input.userId,
    minutes: input.minutes,
    source: input.source,
    reliable: input.reliable,
    fromCountry: input.fromCountry,
    toCountry: input.toCountry,
    startedAt: input.startedAt,
    reportedAt: now,
  });
}

/** Recent driver reports per crossing. */
export async function driverReportSummaries(
  crossingIds: string[],
  now = new Date()
): Promise<Map<string, DriverReportSummary>> {
  if (crossingIds.length === 0) return new Map();
  const rows = await getDb()
    .select({
      crossingId: borderWaitReports.crossingId,
      minutes: borderWaitReports.minutes,
      reportedAt: borderWaitReports.reportedAt,
    })
    .from(borderWaitReports)
    .where(
      and(
        inArray(borderWaitReports.crossingId, crossingIds.slice(0, 200)),
        gt(borderWaitReports.reportedAt, new Date(now.getTime() - REPORT_WINDOW_MS))
      )
    )
    .orderBy(desc(borderWaitReports.reportedAt))
    .limit(2_000);
  return summarize(rows);
}
