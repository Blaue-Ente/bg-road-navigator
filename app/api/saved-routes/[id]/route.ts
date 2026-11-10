import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { deleteSavedRoute } from "@/lib/db/saved";
import { toDbResponse } from "@/lib/server/db-http";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      { error: "Невалиден маршрут", code: "INVALID_ID" },
      { status: 400 }
    );
  }
  try {
    await deleteSavedRoute(auth.user.id, params.data.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error);
  }
}
