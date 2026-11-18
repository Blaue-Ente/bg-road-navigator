import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/api-errors";
import { requireUser } from "@/lib/auth/require-user";
import { deleteChecklist, updateChecks } from "@/lib/db/checklists";
import { requestLocale } from "@/lib/i18n/request-locale";
import { toDbResponse } from "@/lib/server/db-http";

const ParamsSchema = z.object({ id: z.string().uuid() });
const PatchSchema = z.object({
  checks: z.record(z.string().max(80), z.boolean()),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) return apiError(request, "invalidId", "INVALID_ID", 400);
  const body = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(request, "invalidChecklist", "INVALID_CHECKLIST", 400);
  }
  try {
    const checklist = await updateChecks({
      userId: auth.user.id,
      id: params.data.id,
      checks: body.data.checks,
    });
    if (!checklist) return apiError(request, "invalidId", "NOT_FOUND", 404);
    return NextResponse.json({ checklist });
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
    const removed = await deleteChecklist({ userId: auth.user.id, id: params.data.id });
    if (!removed) return apiError(request, "invalidId", "NOT_FOUND", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
