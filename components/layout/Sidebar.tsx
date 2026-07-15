"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon } from "@/components/icons/NavIcons";

const MENU_ITEMS = [
  { href: "/weather", label: "Време", emoji: "🌤️" },
  { href: "/tips", label: "Съвети", emoji: "💡" },
  { href: "/community", label: "Общност", emoji: "📍" },
  { href: "/hotels", label: "Почивки", emoji: "🏨" },
  { href: "/profile", label: "Профил", emoji: "👤" },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMap = pathname === "/";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed z-40 flex h-12 w-12 items-center justify-center rounded-full waze-panel transition hover:scale-105 active:scale-95 ${
          isMap ? "left-3 top-3" : "left-3 top-[4.5rem]"
        }`}
        style={{ marginTop: isMap ? "env(safe-area-inset-top, 0px)" : 0 }}
        aria-label="Меню"
      >
        <MenuIcon className="h-5 w-5 text-[var(--waze-text)]" />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Затвори"
          />
          <aside className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-8 shadow-2xl">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--waze-text-muted)]/40" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--waze-text)]">Меню</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--waze-surface-elevated)] text-[var(--waze-text-muted)]"
                aria-label="Затвори меню"
              >
                ✕
              </button>
            </div>

            <nav className="grid gap-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                    pathname === item.href
                      ? "bg-[var(--waze-accent-muted)] text-[var(--waze-accent)]"
                      : "text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)]"
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
