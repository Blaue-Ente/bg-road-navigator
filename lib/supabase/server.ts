import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { maxAge: number }) {
            cookieStore.set(name, value, options);
          },
          remove(name: string) {
            cookieStore.delete(name);
          },
        },
      },
    }
  );
}
