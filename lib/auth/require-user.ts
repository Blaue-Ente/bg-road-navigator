import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  authRequiredResponse,
  databaseUnavailableResponse,
} from "@/lib/server/db-http";
import { NextResponse } from "next/server";

export async function requireUser(): Promise<
  | { ok: true; user: { id: string; email: string; name: string } }
  | { ok: false; response: NextResponse }
> {
  if (!isDatabaseConfigured()) {
    return { ok: false, response: databaseUnavailableResponse() };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { ok: false, response: authRequiredResponse() };
  }
  return {
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  };
}
