import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { dropSubscription, duePushes, markSent, pruneSent } from "@/lib/db/push";
import { sendPush, vapidConfigured } from "@/lib/push/send";
import { authorizeCron } from "@/lib/server/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return authorizeCron(request);
}

/**
 * Sends the trip notices that are due. Vercel's free cron runs once a day, so
 * ping this every minute from something that can (a cron job on the Oracle VM:
 * `* * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/push-due`).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!vapidConfigured() || !isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, configured: false });
  }
  const now = new Date();
  const due = await duePushes(now);
  const sent: string[] = [];
  let gone = 0;
  let failed = 0;
  for (const push of due) {
    const result = await sendPush(push);
    if (result === "sent") sent.push(push.id);
    else if (result === "gone") {
      gone += 1;
      await dropSubscription(push.endpoint);
    } else failed += 1;
  }
  await markSent(sent, now);
  await pruneSent(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  return NextResponse.json({ ok: true, due: due.length, sent: sent.length, gone, failed });
}
