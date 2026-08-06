import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/stores/user.store";

/** Sign out of Supabase (when configured) and clear local session state. */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase signOut failed:", error);
    }
  }

  useUserStore.getState().clearUser();
}
