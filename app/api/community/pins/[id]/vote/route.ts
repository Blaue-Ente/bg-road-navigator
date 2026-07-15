import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Community service is not configured", code: "COMMUNITY_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const parsedParams = ParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid report id", code: "INVALID_PIN_ID" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  const { error: voteError } = await supabase.from("community_pin_votes").insert({
    pin_id: parsedParams.data.id,
    user_id: user.id,
  });

  if (voteError) {
    if (voteError.code === "23505") {
      return NextResponse.json(
        { error: "Already confirmed", code: "ALREADY_VOTED" },
        { status: 409 }
      );
    }
    console.error("Community vote error:", voteError);
    return NextResponse.json(
      { error: "Unable to confirm report", code: "VOTE_FAILED" },
      { status: 500 }
    );
  }

  const { data: pin } = await supabase
    .from("community_pins")
    .select("upvotes")
    .eq("id", parsedParams.data.id)
    .single();

  return NextResponse.json({ upvotes: pin?.upvotes ?? 0 }, { status: 201 });
}
