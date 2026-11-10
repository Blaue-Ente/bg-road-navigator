"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { MapExperience as MapExperienceComponent } from "@/components/map/MapExperience";

type MapExperienceType = typeof MapExperienceComponent;

/**
 * Loads MapLibre only after the shell has painted, and only on the map
 * route or on a wide screen where the map sits beside the side panel.
 */
export function MapHost() {
  const pathname = usePathname();
  const [desktop, setDesktop] = useState(false);
  const [Experience, setExperience] = useState<MapExperienceType | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const show = pathname === "/" || desktop;

  useEffect(() => {
    if (!show || Experience) return;
    let cancelled = false;
    void import("@/components/map/MapExperience").then((mod) => {
      if (!cancelled) setExperience(() => mod.MapExperience);
    });
    return () => {
      cancelled = true;
    };
  }, [show, Experience]);

  return (
    <div className="absolute inset-0 h-[100dvh] w-full bg-[var(--map-canvas)]">
      {show && Experience ? <Experience /> : null}
    </div>
  );
}
