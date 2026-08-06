import type { SupabaseClient } from "@supabase/supabase-js";

/** Create a minimal profile row when the signup trigger has not run yet. */
export async function ensureProfileRow(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (data) return;

  const base = (email?.split("@")[0] || "user").slice(0, 24);
  await supabase.from("profiles").insert({
    id: userId,
    username: `${base}-${userId.slice(0, 6)}`,
    vehicle_type: "car",
    fuel_type: "diesel",
  });
}
