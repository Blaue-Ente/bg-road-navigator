import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Thermometer,
} from "lucide-react";
import type { WeatherGlyph } from "@/lib/utils/weather-codes";

const GLYPHS: Record<WeatherGlyph, LucideIcon> = {
  sun: Sun,
  "sun-cloud": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  unknown: Thermometer,
};

export function WeatherGlyphIcon({
  name,
  className = "h-7 w-7",
}: {
  name: WeatherGlyph | string;
  className?: string;
}) {
  const Icon = GLYPHS[name as WeatherGlyph] ?? Thermometer;
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}
