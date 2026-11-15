import { NextResponse } from "next/server";
import { refreshFuelBulletin } from "@/lib/fuel-prices/refresh";
import { authorizeCron } from "@/lib/server/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Spends an upstream download, so production stays closed until CRON_SECRET is set. */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return authorizeCron(request);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized", code: "CRON_UNAUTHORIZED" },
      { status: 401 }
    );
  }
  try {
    const report = await refreshFuelBulletin();
    return NextResponse.json(report, { status: report.ok ? 200 : 502 });
  } catch (error) {
    console.error("Fuel bulletin refresh failed:", error);
    return NextResponse.json(
      { error: "Fuel bulletin refresh failed", code: "BULLETIN_FAILED" },
      { status: 500 }
    );
  }
}
