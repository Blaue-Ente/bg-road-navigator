"use client";

/**
 * App-wide shell wrapper. Browse is public; login unlocks extras
 * (favorites, community writes). Do not hard-redirect here.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
