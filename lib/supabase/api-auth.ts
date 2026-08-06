import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export function supabaseUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Supabase is not configured",
      code: "SUPABASE_UNAVAILABLE",
      configured: false,
    },
    { status: 503 }
  );
}

export function authRequiredResponse() {
  return NextResponse.json(
    { error: "Authentication required", code: "AUTH_REQUIRED" },
    { status: 401 }
  );
}

/**
 * Cookie-session Supabase user for write/read of private data.
 * Returns null responses when env or session is missing.
 */
export async function requireAuthedSupabase(): Promise<
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, response: supabaseUnavailableResponse() };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: authRequiredResponse() };
  }

  return { ok: true, supabase, user };
}
