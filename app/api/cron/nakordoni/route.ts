import { NextResponse } from "next/server";
import { refreshNakordoniCache } from "@/lib/nakordoni/refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization");
  if (!secret) return process.env.NODE_ENV !== "production";
  return header === `Bearer ${secret}`;
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
