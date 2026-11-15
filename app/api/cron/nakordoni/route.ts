import { NextResponse } from "next/server";
import { loadHatarinfo } from "@/lib/borders/hatarinfo";
import { loadDatexSnapshot } from "@/lib/hazards/datex";
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
  const hatarinfoPromise = refreshHatarinfo();
  const datexPromise = refreshDatex();
  try {
    const report = await refreshNakordoniCache();
    const [hatarinfo, datex] = await Promise.all([
      hatarinfoPromise,
      datexPromise,
    ]);
    const status = report.skipped === "migration_required" ? 503 : 200;
    return NextResponse.json({ ...report, hatarinfo, datex }, { status });
  } catch (error) {
    await Promise.all([hatarinfoPromise, datexPromise]);
    console.error("Nakordoni refresh failed:", error);
    return NextResponse.json(
      { error: "Nakordoni refresh failed", code: "NAKORDONI_REFRESH_FAILED" },
      { status: 500 }
    );
  }
}

async function refreshDatex(): Promise<{ ok: boolean; situations: number }> {
  try {
    const snapshot = await loadDatexSnapshot();
    return {
      ok: snapshot != null,
      situations: snapshot?.situations.length ?? 0,
    };
  } catch {
    return { ok: false, situations: 0 };
  }
}

async function refreshHatarinfo(): Promise<{ ok: boolean; crossings: number }> {
  try {
    const snapshot = await loadHatarinfo();
    return { ok: snapshot != null, crossings: snapshot?.crossings.length ?? 0 };
  } catch {
    return { ok: false, crossings: 0 };
  }
}

export const GET = handle;
export const POST = handle;
