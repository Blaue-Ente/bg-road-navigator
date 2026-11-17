import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchBorderStatus } from "@/lib/api-clients/border-scraper";
import { isDatabaseConfigured } from "@/lib/db";
import { driverReportSummaries } from "@/lib/db/border-reports";
import { withTimeout } from "@/lib/server/with-timeout";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n/locale";

const BorderQuerySchema = z.object({
  crossing_id: z.string().optional(),
  region: z
    .enum([
      "all",
      "bulgaria",
      "balkans",
      "central",
      "western",
      "southern",
      "eastern",
      "route",
    ])
    .optional(),
  corridor_id: z.string().optional(),
  border_ids: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const crossingId = searchParams.get("crossing_id");
    const region = searchParams.get("region");
    const corridorId = searchParams.get("corridor_id");
    const borderIds = searchParams.get("border_ids");

    const parsed = BorderQuerySchema.safeParse({
      crossing_id: crossingId ?? undefined,
      region: region ?? undefined,
      corridor_id: corridorId ?? undefined,
      border_ids: borderIds ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    const locale = parseLocale(request.cookies.get(LOCALE_COOKIE)?.value);
    const started = Date.now();
    const diagnostics: string[] = [];
    const borderStatus = await fetchBorderStatus({
      diagnostics,
      crossingId: parsed.data.crossing_id,
      region: parsed.data.region,
      corridorId: parsed.data.corridor_id,
      borderIds: parsed.data.border_ids
        ? parsed.data.border_ids.split(",").filter(Boolean)
        : undefined,
      locale,
    });

    // What drivers who just crossed reported. Missing table or database: skip.
    let reports = new Map<string, { minutes: number; count: number; latest_at: string }>();
    if (isDatabaseConfigured()) {
      try {
        reports = await withTimeout(
          driverReportSummaries(borderStatus.map((b) => b.crossing_id)),
          3_000,
          reports,
          () => diagnostics.push("driver reports timed out")
        );
      } catch {
        // The migration may not be applied yet: the page works without it.
      }
    }
    return NextResponse.json(
      borderStatus.map((border) => {
        const driver = reports.get(border.crossing_id);
        return driver ? { ...border, driver_reports: driver } : border;
      }),
      // Only the timings and the names of slow sources: no data, no keys.
      searchParams.get("debug") === "1"
        ? {
            headers: {
              "X-Border-Timings": JSON.stringify({
                ms: Date.now() - started,
                slow: diagnostics,
              }),
            },
          }
        : undefined
    );
  } catch (error) {
    console.error("Borders API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch border data", code: "BORDER_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
