import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthedSupabase } from "@/lib/supabase/api-auth";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      { error: "Invalid route id", code: "INVALID_ID" },
      { status: 400 }
    );
  }

  const { error } = await auth.supabase
    .from("saved_routes")
    .delete()
    .eq("id", params.data.id)
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("Saved route delete error:", error);
    return NextResponse.json(
      { error: "Unable to delete route", code: "SAVED_ROUTE_DELETE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
