import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Lightweight liveness for Railway / uptime checks. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "bg-road-navigator",
    database_configured: isDatabaseConfigured(),
    supabase_configured: isSupabaseConfigured(),
    ts: new Date().toISOString(),
  });
}
