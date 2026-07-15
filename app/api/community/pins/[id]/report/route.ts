import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  reason: z.string().trim().min(3).max(300),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Community service is not configured", code: "COMMUNITY_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const [parsedParams, parsedBody] = await Promise.all([
    Promise.resolve(ParamsSchema.safeParse(await context.params)),
    request.json().then((body) => BodySchema.safeParse(body)),
  ]);

  if (!parsedParams.success || !parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid report request", code: "INVALID_REPORT" },
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

  const { error } = await supabase.from("community_pin_reports").insert({
    pin_id: parsedParams.data.id,
    reporter_id: user.id,
    reason: parsedBody.data.reason,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already reported", code: "ALREADY_REPORTED" },
        { status: 409 }
      );
    }
    console.error("Community report error:", error);
    return NextResponse.json(
      { error: "Unable to submit report", code: "REPORT_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
