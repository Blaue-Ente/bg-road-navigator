import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { probeDatabase } from "@/lib/db/health";

/** Process liveness plus a short database probe. Never returns secret values. */
export async function GET() {
  const database_configured = isDatabaseConfigured();
  const probe = database_configured
    ? await probeDatabase(process.env.DATABASE_URL!.trim())
    : { reachable: false, authTablesReady: false };

  return NextResponse.json({
    ok: true,
    service: "bg-road-navigator",
    database_configured,
    database_reachable: probe.reachable,
    auth_tables_ready: probe.authTablesReady,
    ts: new Date().toISOString(),
  });
}
