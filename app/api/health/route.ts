import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Lightweight liveness for Railway / uptime checks. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "bg-road-navigator",
    supabase_configured: isSupabaseConfigured(),
    ts: new Date().toISOString(),
  });
}
