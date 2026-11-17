import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestLocale } from "@/lib/i18n/request-locale";
import { apiError } from "@/lib/api/api-errors";
import { requireUser } from "@/lib/auth/require-user";
import { deleteVehicle, updateVehicle } from "@/lib/db/vehicles";
import { toDbResponse } from "@/lib/server/db-http";
import { VehiclePatchSchema } from "@/lib/vehicles/types";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) return apiError(request, "invalidId", "INVALID_ID", 400);
  const body = VehiclePatchSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!body.success) {
    return apiError(request, "invalidVehicle", "INVALID_VEHICLE", 400);
  }
  try {
    const vehicle = await updateVehicle(auth.user.id, params.data.id, body.data);
    if (!vehicle) return apiError(request, "invalidId", "NOT_FOUND", 404);
    return NextResponse.json({ vehicle });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) return apiError(request, "invalidId", "INVALID_ID", 400);
  try {
    await deleteVehicle(auth.user.id, params.data.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
