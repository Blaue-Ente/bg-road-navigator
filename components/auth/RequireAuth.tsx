"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Short reason shown when the user is anonymous */
  reason?: string;
  className?: string;
}

/**
 * Gates write/profile features. Guests still see the surrounding page;
 * only the children are replaced with a soft unlock CTA.
 */
export function RequireAuth({
  children,
  reason,
  className,
}: RequireAuthProps) {
  const m = useMessages();
  const resolvedReason = reason ?? m.auth.msg63ff7dd981;
  const session = useUserStore((s) => s.session);
  const isLoading = useUserStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div
        className={
          className ?? "waze-panel p-4 text-sm text-[var(--waze-text-muted)]"
        }
      >{m.fuelPage.suspense}</div>
    );
  }

  if (!session) {
    return (
      <div
        className={
          className ??
          "waze-panel flex flex-col items-start gap-3 p-4 text-sm text-[var(--waze-text-secondary)]"
        }
      >
        <p>{resolvedReason}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/login" className="waze-btn-primary px-4 py-2 text-xs">{m.login.title}</Link>
          <Link
            href="/register"
            className="waze-btn-secondary px-4 py-2 text-xs"
          >{m.login.register}</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
