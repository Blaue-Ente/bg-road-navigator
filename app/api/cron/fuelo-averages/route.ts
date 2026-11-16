import { NextResponse } from "next/server";
import { refreshFueloAverages } from "@/lib/fuel-prices/fuelo-refresh";
import { authorizeCron } from "@/lib/server/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    const report = await refreshFueloAverages();
    return NextResponse.json(report, { status: report.ok ? 200 : 502 });
  } catch (error) {
    console.error("Fuelo refresh failed:", error);
    return NextResponse.json(
      { error: "Fuelo refresh failed", code: "FUELO_FAILED" },
      { status: 500 }
    );
  }
}