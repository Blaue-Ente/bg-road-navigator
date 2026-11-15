import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { insertFuelReport, listValidFuelReports } from "@/lib/db/fuel-reports";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const ReportSchema = z.object({
  station_id: z.string().trim().min(1).max(80),
  fuel_type: z.enum(["diesel", "petrol", "lpg"]),
  price: z.number().finite().min(0.4).max(6),
  photo_url: z.string().url().max(500).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const stationId = request.nextUrl.searchParams.get("station_id")?.trim();
  const fuel = request.nextUrl.searchParams.get("fuel_type")?.trim();
  if (!stationId || (fuel !== "diesel" && fuel !== "petrol" && fuel !== "lpg")) {
    return NextResponse.json(
      { error: "Липсва станция или гориво", code: "INVALID_REPORT_QUERY" },
      { status: 400 }
    );
  }
  try {
    const reports = await listValidFuelReports([stationId], fuel);
    return NextResponse.json({ reports });
  } catch (error) {
    return toDbResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `fuel-report:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    8,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = ReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Невалидна цена", code: "INVALID_PRICE_REPORT" },
      { status: 400 }
    );
  }
  try {
    const report = await insertFuelReport({
      stationId: parsed.data.station_id,
      fuelType: parsed.data.fuel_type,
      price: parsed.data.price,
      photoUrl: parsed.data.photo_url ?? null,
      reporterId: auth.user.id,
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return toDbResponse(error);
  }
}
