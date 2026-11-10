import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { voteOnPin } from "@/lib/db/community";
import { ensureProfile } from "@/lib/db/profiles";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  kind: z.enum(["still_there", "gone"]).default("still_there"),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limit = rateLimit(
    `vote:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    30,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();

  const parsedParams = ParamsSchema.safeParse(await context.params);
  const raw = await request.json().catch(() => ({}));
  const parsedBody = BodySchema.safeParse(raw);
  if (!parsedParams.success || !parsedBody.success) {
    return NextResponse.json(
      { error: "Невалиден глас", code: "INVALID_PIN_ID" },
      { status: 400 }
    );
  }

  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const result = await voteOnPin({
      pinId: parsedParams.data.id,
      userId: auth.user.id,
      kind: parsedBody.data.kind,
    });
    if (result === "missing") {
      return NextResponse.json(
        { error: "Сигналът липсва", code: "PIN_NOT_FOUND" },
        { status: 404 }
      );
    }
    if (result === "same") {
      return NextResponse.json(
        { error: "Вече сте гласували така", code: "ALREADY_VOTED" },
        { status: 409 }
      );
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toDbResponse(error);
  }
}
