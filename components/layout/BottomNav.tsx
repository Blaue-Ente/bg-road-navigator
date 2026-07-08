"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Карта", icon: "🗺️" },
  { href: "/route", label: "Маршрут", icon: "🧭" },
  { href: "/borders", label: "Граници", icon: "🛃" },
  { href: "/fuel", label: "Горива", icon: "⛽" },
  { href: "/emergency", label: "Спешно", icon: "🚨" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-around z-20">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || 
          (item.href === "/" && pathname === "/(app)");
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition ${
              isActive ? "text-blue-400" : "text-gray-400 hover:text-white"
            }`}
            aria-label={item.label}
          >
            <span className="text-xl" aria-hidden="true">
              {item.icon}
            </span>
            <span className="text-xs mt-1 hidden sm:block">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}