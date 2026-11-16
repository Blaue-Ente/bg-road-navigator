import { NextRequest, NextResponse } from "next/server";
import { requestLocale } from "@/lib/i18n/request-locale";
import { apiError } from "@/lib/api/api-errors";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { addComment, listComments } from "@/lib/db/community";
import { ensureProfile } from "@/lib/db/profiles";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const ParamsSchema = z.object({ id: z.string().uuid() });
const CommentSchema = z.object({
  body: z.string().trim().min(1).max(500),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ comments: [], configured: false });
  }
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return apiError(request, "invalidPin", "INVALID_ID", 400);
  }
  try {
    const comments = await listComments(params.data.id);
    return NextResponse.json({ comments, configured: true });
  } catch (error) {
    const response = toDbResponse(error, requestLocale(request));
    if (response.status === 503) {
      return NextResponse.json({ comments: [], configured: false });
    }
    return response;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limit = rateLimit(
    `comment:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    20,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();

  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return apiError(request, "invalidPin", "INVALID_ID", 400);
  }
  const parsed = CommentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError(request, "invalidComment", "INVALID_COMMENT", 400);
  }

  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const comment = await addComment({
      pinId: params.data.id,
      userId: auth.user.id,
      body: parsed.data.body,
    });
    if (comment === "missing") {
      return apiError(request, "pinNotFound", "PIN_NOT_FOUND", 404);
    }
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
