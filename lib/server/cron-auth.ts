import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the env var is set.
 * A manual ping may use `x-cron-secret` instead. With no secret, the route stays open
 * so a project can warm before the operator pastes one. It never returns the OCI key.
 */
export function authorizeCron(
  request: Request,
  env?: { CRON_SECRET?: string }
): boolean {
  const secret = (env ? env.CRON_SECRET : process.env.CRON_SECRET)?.trim();
  if (!secret) return true;
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
  const header = request.headers.get("x-cron-secret")?.trim() ?? null;
  return matchesSecret(bearer, secret) || matchesSecret(header, secret);
}

function matchesSecret(provided: string | null, secret: string): boolean {
  if (!provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
