import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { deleteAccount, exportAccount } from "@/lib/db/account";
import { requestLocale } from "@/lib/i18n/request-locale";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const DeleteSchema = z.object({
  confirm: z.literal(true),
  delete_posts: z.boolean().default(false),
});

/** A download of everything stored about the signed-in driver. */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (!rateLimit(`account-export:${auth.user.id}`, 5, 60_000).ok) {
    return rateLimitedResponse(requestLocale(request));
  }
  try {
    const data = await exportAccount(auth.user.id, {
      email: auth.user.email,
      name: auth.user.name,
    });
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bg-navigator-data.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}

/** Deletes the account and its data. Needs an explicit `confirm: true`. */
export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const ip = clientIpFromHeaders(request.headers);
  if (!rateLimit(`account-delete:${ip}`, 5, 60_000).ok) {
    return rateLimitedResponse(requestLocale(request));
  }
  const parsed = DeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "confirmation required" }, { status: 400 });
  }
  try {
    await deleteAccount({
      userId: auth.user.id,
      deletePosts: parsed.data.delete_posts,
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
