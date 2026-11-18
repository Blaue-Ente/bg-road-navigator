import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { deleteHistory } from "@/lib/db/history";
import { requestLocale } from "@/lib/i18n/request-locale";
import { toDbResponse } from "@/lib/server/db-http";

export const dynamic = "force-dynamic";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }
  try {
    await deleteHistory(auth.user.id, params.data.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
