import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthedSupabase } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureProfileRow } from "@/lib/supabase/ensure-profile";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const CommentSchema = z.object({
  body: z.string().trim().min(1).max(500),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ comments: [], configured: false });
  }

  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      { error: "Invalid pin id", code: "INVALID_ID" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pin_comments")
    .select("id, pin_id, user_id, body, created_at")
    .eq("pin_id", params.data.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Pin comments load error:", error);
    return NextResponse.json(
      { error: "Unable to load comments", code: "COMMENTS_LOAD_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ comments: data ?? [], configured: true });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      { error: "Invalid pin id", code: "INVALID_ID" },
      { status: 400 }
    );
  }

  const parsed = CommentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid comment", code: "INVALID_COMMENT" },
      { status: 400 }
    );
  }

  await ensureProfileRow(auth.supabase, auth.user.id, auth.user.email);

  const { data: pin } = await auth.supabase
    .from("community_pins")
    .select("id")
    .eq("id", params.data.id)
    .maybeSingle();

  if (!pin) {
    return NextResponse.json(
      { error: "Pin not found", code: "PIN_NOT_FOUND" },
      { status: 404 }
    );
  }

  const { data, error } = await auth.supabase
    .from("pin_comments")
    .insert({
      pin_id: params.data.id,
      user_id: auth.user.id,
      body: parsed.data.body,
    })
    .select("id, pin_id, user_id, body, created_at")
    .single();

  if (error) {
    console.error("Pin comment create error:", error);
    return NextResponse.json(
      { error: "Unable to post comment", code: "COMMENT_CREATE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
