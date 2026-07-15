/** WMO Weather interpretation codes (Open-Meteo) */

const WMO_LABELS_BG: Record<number, { condition: string; icon: string }> = {
  0: { condition: "ясно", icon: "☀️" },
  1: { condition: "предимно ясно", icon: "🌤️" },
  2: { condition: "частична облачност", icon: "⛅" },
  3: { condition: "облачно", icon: "☁️" },
  45: { condition: "мъгла", icon: "🌫️" },
  48: { condition: "мъгла със скреж", icon: "🌫️" },
  51: { condition: "слаба ръмеж", icon: "🌦️" },
  53: { condition: "ръмеж", icon: "🌦️" },
  55: { condition: "силен ръмеж", icon: "🌧️" },
  56: { condition: "леден ръмеж", icon: "🌧️" },
  57: { condition: "силен леден ръмеж", icon: "🌧️" },
  61: { condition: "слаб дъжд", icon: "🌧️" },
  63: { condition: "дъжд", icon: "🌧️" },
  65: { condition: "силен дъжд", icon: "🌧️" },
  66: { condition: "леден дъжд", icon: "🌧️" },
  67: { condition: "силен леден дъжд", icon: "🌧️" },
  71: { condition: "слаб сняг", icon: "❄️" },
  73: { condition: "сняг", icon: "❄️" },
  75: { condition: "силен сняг", icon: "❄️" },
  77: { condition: "снежни зърна", icon: "❄️" },
  80: { condition: "кратковременен дъжд", icon: "🌦️" },
  81: { condition: "дъжд", icon: "🌧️" },
  82: { condition: "ливен дъжд", icon: "⛈️" },
  85: { condition: "слаб сняг", icon: "❄️" },
  86: { condition: "силен сняг", icon: "❄️" },
  95: { condition: "гръмотевици", icon: "⛈️" },
  96: { condition: "гръмотевици с град", icon: "⛈️" },
  99: { condition: "силни гръмотевици с град", icon: "⛈️" },
};

export function wmoToWeather(code: number) {
  return (
    WMO_LABELS_BG[code] ?? {
      condition: "неизвестно",
      icon: "🌡️",
    }
  );
}
