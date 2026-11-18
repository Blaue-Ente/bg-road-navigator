"use client";

import { useEffect, useState } from "react";
import {
  BedDouble,
  Camera,
  CloudSun,
  Coffee,
  Fuel,
  Landmark,
  MapPinned,
  Mountain,
  Route,
  Tent,
  TreePine,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const ICONS: LucideIcon[] = [
  Route,
  Mountain,
  Landmark,
  Fuel,
  Coffee,
  CloudSun,
  TreePine,
  BedDouble,
  Camera,
  UtensilsCrossed,
  Tent,
  MapPinned,
];

const STEP_MS = 1500;

/**
 * Pictograms that change while a plan is being made, so waiting feels like part
 * of the trip. They are decoration: the text next to them says what is going on,
 * and with reduced motion one icon stays.
 */
export function TripLoadingIcons({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }
    if (reduced) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % ICONS.length),
      STEP_MS
    );
    return () => window.clearInterval(timer);
  }, []);

  const Icon = ICONS[index]!;
  return (
    <span
      aria-hidden
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--waze-accent-muted)] text-[var(--waze-accent-text)] ${className}`.trim()}
    >
      <Icon key={index} className="trip-loading-icon h-5 w-5" strokeWidth={2} />
    </span>
  );
}
