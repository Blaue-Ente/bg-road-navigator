import { NextResponse } from "next/server";
import { buildConfigStatus } from "@/lib/config/service-status";

/**
 * Public readiness probe — booleans and labels only, never secret values.
 * Useful for operators and cloud agents after pasting env vars.
 */
export async function GET() {
  const status = buildConfigStatus();
  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
