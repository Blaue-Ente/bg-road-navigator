import { NextRequest, NextResponse } from "next/server";
import { requestLocale } from "@/lib/i18n/request-locale";
import { apiError } from "@/lib/api/api-errors";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { ensureProfile } from "@/lib/db/profiles";
import {
  insertVehicle,
  listVehicles,
  VehicleLimitError,
} from "@/lib/db/vehicles";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";
import { VehicleInputSchema } from "@/lib/vehicles/types";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ vehicles: [], configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({
      vehicles: await listVehicles(auth.user.id),
      configured: true,
    });
  } catch (error) {
    const response = toDbResponse(error, requestLocale(request));
    if (response.status === 503) {
      return NextResponse.json({ vehicles: [], configured: false });
    }
    return response;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `vehicle:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    20,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = VehicleInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return apiError(request, "invalidVehicle", "INVALID_VEHICLE", 400);
  }
  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const vehicle = await insertVehicle(auth.user.id, parsed.data);
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof VehicleLimitError) {
      return apiError(request, "vehicleLimit", "VEHICLE_LIMIT", 400);
    }
    return toDbResponse(error, requestLocale(request));
  }
}
