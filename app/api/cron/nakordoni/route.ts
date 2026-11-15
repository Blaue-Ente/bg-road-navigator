import { NextResponse } from "next/server";
import { refreshNakordoniCache } from "@/lib/nakordoni/refresh";
import { authorizeCron } from "@/lib/server/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Same bearer / x-cron-secret check as warm-geo. This route spends the Nakordoni
 * quota, so production stays closed until CRON_SECRET is set. Warm-geo stays open
 * without a secret because it only pings Valhalla and Photon.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return authorizeCron(request);
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized", code: "CRON_UNAUTHORIZED" },
      { status: 401 }
    );
  }
  try {
    const report = await refreshNakordoniCache();
    const status = report.skipped === "migration_required" ? 503 : 200;
    return NextResponse.json(report, { status });
  } catch (error) {
    console.error("Nakordoni refresh failed:", error);
    return NextResponse.json(
      { error: "Nakordoni refresh failed", code: "NAKORDONI_REFRESH_FAILED" },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
