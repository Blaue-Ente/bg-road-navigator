import { describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "@/lib/supabase/config";

describe("isSupabaseConfigured", () => {
  it("is false when env vars are missing or blank", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(isSupabaseConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  ";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is true when both values are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    expect(isSupabaseConfigured()).toBe(true);
  });
});
