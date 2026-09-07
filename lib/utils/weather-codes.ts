/** WMO Weather interpretation codes (Open-Meteo) */

export type WeatherGlyph =
  | "sun"
  | "sun-cloud"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm"
  | "unknown";

const WMO_LABELS_BG: Record<number, { condition: string; icon: WeatherGlyph }> =
  {
    0: { condition: "ясно", icon: "sun" },
    1: { condition: "предимно ясно", icon: "sun-cloud" },
    2: { condition: "частична облачност", icon: "sun-cloud" },
    3: { condition: "облачно", icon: "cloud" },
    45: { condition: "мъгла", icon: "fog" },
    48: { condition: "мъгла със скреж", icon: "fog" },
    51: { condition: "слаба ръмеж", icon: "drizzle" },
    53: { condition: "ръмеж", icon: "drizzle" },
    55: { condition: "силен ръмеж", icon: "rain" },
    56: { condition: "леден ръмеж", icon: "rain" },
    57: { condition: "силен леден ръмеж", icon: "rain" },
    61: { condition: "слаб дъжд", icon: "rain" },
    63: { condition: "дъжд", icon: "rain" },
    65: { condition: "силен дъжд", icon: "rain" },
    66: { condition: "леден дъжд", icon: "rain" },
    67: { condition: "силен леден дъжд", icon: "rain" },
    71: { condition: "слаб сняг", icon: "snow" },
    73: { condition: "сняг", icon: "snow" },
    75: { condition: "силен сняг", icon: "snow" },
    77: { condition: "снежни зърна", icon: "snow" },
    80: { condition: "кратковременен дъжд", icon: "drizzle" },
    81: { condition: "дъжд", icon: "rain" },
    82: { condition: "ливен дъжд", icon: "storm" },
    85: { condition: "слаб сняг", icon: "snow" },
    86: { condition: "силен сняг", icon: "snow" },
    95: { condition: "гръмотевици", icon: "storm" },
    96: { condition: "гръмотевици с град", icon: "storm" },
    99: { condition: "силни гръмотевици с град", icon: "storm" },
  };

export function wmoToWeather(code: number) {
  return (
    WMO_LABELS_BG[code] ?? {
      condition: "неизвестно",
      icon: "unknown" as WeatherGlyph,
    }
  );
}
