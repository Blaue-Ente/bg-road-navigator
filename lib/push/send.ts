import * as webpush from "web-push";
import type { DuePush } from "@/lib/db/push";

export function vapidConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.VAPID_PRIVATE_KEY?.trim() &&
      (env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? env.VAPID_PUBLIC_KEY)?.trim()
  );
}

export type SendResult = "sent" | "gone" | "failed";

/** One push. "gone" means the browser dropped the subscription: stop sending to it. */
export async function sendPush(push: DuePush): Promise<SendResult> {
  const publicKey = (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? ""
  ).trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
  const subject = (process.env.VAPID_SUBJECT ?? "mailto:admin@localhost").trim();
  if (!publicKey || !privateKey) return "failed";
  try {
    await webpush.sendNotification(
      { endpoint: push.endpoint, keys: { p256dh: push.p256dh, auth: push.auth } },
      JSON.stringify({
        title: push.title,
        body: push.body,
        tag: push.tag,
        url: push.url,
      }),
      {
        TTL: 1800,
        urgency: "normal",
        vapidDetails: { subject, publicKey, privateKey },
      }
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "gone" : "failed";
  }
}
