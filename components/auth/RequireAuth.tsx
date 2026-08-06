"use client";

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
  reason = "Влезте в профила си, за да ползвате тази функция.",
  className,
}: RequireAuthProps) {
  const session = useUserStore((s) => s.session);
  const isLoading = useUserStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className={className ?? "waze-panel p-4 text-sm text-[var(--waze-text-muted)]"}>
        Зареждане...
      </div>
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
        <p>{reason}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/login" className="waze-btn-primary px-4 py-2 text-xs">
            Вход
          </Link>
          <Link href="/register" className="waze-btn-secondary px-4 py-2 text-xs">
            Регистрация
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
