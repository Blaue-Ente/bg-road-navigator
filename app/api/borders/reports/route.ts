import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/api-errors";
import { requireUser } from "@/lib/auth/require-user";
import { getAllEuropeanCrossings } from "@/lib/constants/european-borders";
import { insertBorderReport, ReportTooSoonError } from "@/lib/db/border-reports";
import { ensureProfile } from "@/lib/db/profiles";
import { requestLocale } from "@/lib/i18n/request-locale";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const KNOWN = new Set(getAllEuropeanCrossings().map((crossing) => crossing.id));

const ReportSchema = z.object({
  crossing_id: z.string().max(60).refine((id) => KNOWN.has(id)),
  minutes: z.number().int().min(1).max(720),
  source: z.enum(["auto", "manual"]).default("manual"),
  reliable: z.boolean().default(true),
  from_country: z.string().regex(/^[A-Z]{2}$/).nullable().optional(),
  to_country: z.string().regex(/^[A-Z]{2}$/).nullable().optional(),
  started_at: z.string().datetime().nullable().optional(),
});

/**
 * A signed-in driver shares how long a border took. Only the crossing, the
 * minutes and the times are kept, never the route.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `border-report:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    10,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = ReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(request, "invalidBorderReport", "INVALID_BORDER_REPORT", 400);
  }
  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    await insertBorderReport({
      userId: auth.user.id,
      crossingId: parsed.data.crossing_id,
      minutes: parsed.data.minutes,
      source: parsed.data.source,
      reliable: parsed.data.reliable,
      fromCountry: parsed.data.from_country ?? null,
      toCountry: parsed.data.to_country ?? null,
      startedAt: parsed.data.started_at ? new Date(parsed.data.started_at) : null,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ReportTooSoonError) {
      return apiError(request, "borderReportTooSoon", "BORDER_REPORT_TOO_SOON", 409);
    }
    return toDbResponse(error, requestLocale(request));
  }
}
