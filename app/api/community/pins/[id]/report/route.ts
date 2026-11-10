import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { reportPin } from "@/lib/db/community";
import { ensureProfile } from "@/lib/db/profiles";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  reason: z.string().trim().min(3).max(300),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limit = rateLimit(
    `report:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    15,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();

  const [parsedParams, parsedBody] = await Promise.all([
    Promise.resolve(ParamsSchema.safeParse(await context.params)),
    request.json().then((body) => BodySchema.safeParse(body)),
  ]);

  if (!parsedParams.success || !parsedBody.success) {
    return NextResponse.json(
      { error: "Невалиден доклад", code: "INVALID_REPORT" },
      { status: 400 }
    );
  }

  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const result = await reportPin({
      pinId: parsedParams.data.id,
      userId: auth.user.id,
      reason: parsedBody.data.reason,
    });
    if (result === "missing") {
      return NextResponse.json(
        { error: "Сигналът липсва", code: "PIN_NOT_FOUND" },
        { status: 404 }
      );
    }
    if (result === "duplicate") {
      return NextResponse.json(
        { error: "Вече сте докладвали този сигнал", code: "ALREADY_REPORTED" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return toDbResponse(error);
  }
}
