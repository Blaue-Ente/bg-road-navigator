import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/api-errors";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { listChecklists, mergeChecksByPlan, upsertChecklist } from "@/lib/db/checklists";
import { ensureProfile } from "@/lib/db/profiles";
import { requestLocale } from "@/lib/i18n/request-locale";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const ItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(200),
  detail: z.string().trim().max(600).default(""),
});

const SaveChecklistSchema = z.object({
  plan_key: z.string().trim().min(6).max(64),
  title: z.string().trim().min(1).max(160),
  destination: z.string().trim().min(1).max(160),
  depart_at: z.string().datetime().nullable().optional(),
  groups: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        title: z.string().trim().min(1).max(120),
        items: z.array(ItemSchema).max(60),
      })
    )
    .max(10),
  checks: z.record(z.string().max(80), z.boolean()).default({}),
});

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ checklists: [], configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({
      checklists: await listChecklists(auth.user.id),
      configured: true,
    });
  } catch (error) {
    const response = toDbResponse(error, requestLocale(request));
    // A missing table reads as "not set up yet", the way the other lists do.
    if (response.status === 503) {
      return NextResponse.json({ checklists: [], configured: false });
    }
    return response;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `checklist-save:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    20,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = SaveChecklistSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(request, "invalidChecklist", "INVALID_CHECKLIST", 400);
  }
  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const checklist = await upsertChecklist({
      userId: auth.user.id,
      planKey: parsed.data.plan_key,
      title: parsed.data.title,
      destination: parsed.data.destination,
      departAt: parsed.data.depart_at ? new Date(parsed.data.depart_at) : null,
      groups: parsed.data.groups,
      checks: parsed.data.checks,
    });
    return NextResponse.json({ checklist });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}

const TickSchema = z.object({
  plan_key: z.string().trim().min(6).max(64),
  checks: z.record(z.string().max(80), z.boolean()),
});

/** A tick in the plan sheet reaches the saved checklist, when the plan has one. */
export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = TickSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(request, "invalidChecklist", "INVALID_CHECKLIST", 400);
  }
  try {
    const checklist = await mergeChecksByPlan({
      userId: auth.user.id,
      planKey: parsed.data.plan_key,
      checks: parsed.data.checks,
    });
    return NextResponse.json({ checklist, saved: checklist != null });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
