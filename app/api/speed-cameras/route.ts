import { NextRequest, NextResponse } from "next/server";
import { loadSpeedCameras, recentCameraErrors } from "@/lib/api-clients/speed-cameras";
import { EuropeBboxSchema } from "@/lib/server/geo-schema";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * Fixed speed cameras mapped in OpenStreetMap (ODbL). Map points only: no
 * alerts, and nothing is returned for France or Switzerland, where showing
 * camera positions is banned.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(
    `speed-cameras:${clientIpFromHeaders(request.headers)}`,
    120,
    60_000
  );
  if (!limit.ok) {
    return NextResponse.json({ cameras: [], ok: false }, { status: 429 });
  }
  const params = request.nextUrl.searchParams;
  const parsed = EuropeBboxSchema.safeParse({
    w: Number(params.get("w")),
    s: Number(params.get("s")),
    e: Number(params.get("e")),
    n: Number(params.get("n")),
  });
  // Wide views are fine now that the dataset is local; a whole continent is not.
  if (!parsed.success || parsed.data.e - parsed.data.w > 16 || parsed.data.n - parsed.data.s > 12) {
    return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
  }
  const result = await loadSpeedCameras(parsed.data);
  const body =
    params.get("debug") === "1" ? { ...result, errors: recentCameraErrors() } : result;
  return NextResponse.json(body, {
    headers: {
      // A failure must not be kept by the CDN: the next view should try again.
      "Cache-Control": result.ok
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "no-store",
    },
  });
}
