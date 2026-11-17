import { NextRequest, NextResponse } from "next/server";
import { estimateConsumption } from "@/lib/vehicles/estimate";
import { lookupConsumption } from "@/lib/vehicles/fuel-economy";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Known extra-urban consumption for a car name. Never needs a sign-in. */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 80) {
    return NextResponse.json({ candidates: [] });
  }
  const limit = rateLimit(
    `vehicle-lookup:${clientIpFromHeaders(request.headers)}`,
    10,
    60_000
  );
  if (!limit.ok) {
    return NextResponse.json({ candidates: [], rate_limited: true }, { status: 429 });
  }
  let candidates = await lookupConsumption(query);
  if (candidates.length === 0) {
    const estimate = await estimateConsumption(query);
    if (estimate) candidates = [estimate];
  }
  return NextResponse.json({ candidates });
}
