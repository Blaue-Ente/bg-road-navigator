/** WMO Weather interpretation codes (Open-Meteo) */

import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";
import type { Locale } from "@/lib/i18n/locale";

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

const UNKNOWN: Localized = {
  bg: "неизвестно",
  en: "unknown",
  tr: "bilinmiyor",
  ro: "necunoscut",
};

const WMO: Record<
  number,
  { icon: WeatherGlyph; text: Localized }
> = {
  0: {
    icon: "sun",
    text: {
      bg: "ясно",
      en: "clear",
      tr: "açık",
      ro: "senin",
    },
  },
  1: {
    icon: "sun-cloud",
    text: {
      bg: "предимно ясно",
      en: "mainly clear",
      tr: "çoğunlukla açık",
      ro: "predominant senin",
    },
  },
  2: {
    icon: "sun-cloud",
    text: {
      bg: "частична облачност",
      en: "partly cloudy",
      tr: "parçalı bulutlu",
      ro: "parțial înnorat",
    },
  },
  3: {
    icon: "cloud",
    text: {
      bg: "облачно",
      en: "overcast",
      tr: "kapalı",
      ro: "înnorat",
    },
  },
  45: {
    icon: "fog",
    text: {
      bg: "мъгла",
      en: "fog",
      tr: "sis",
      ro: "ceață",
    },
  },
  48: {
    icon: "fog",
    text: {
      bg: "мъгла със скреж",
      en: "freezing fog",
      tr: "don sis",
      ro: "ceață cu chiciură",
    },
  },
  51: {
    icon: "drizzle",
    text: {
      bg: "слаба ръмеж",
      en: "light drizzle",
      tr: "hafif çisenti",
      ro: "burniță slabă",
    },
  },
  53: {
    icon: "drizzle",
    text: {
      bg: "ръмеж",
      en: "drizzle",
      tr: "çisenti",
      ro: "burniță",
    },
  },
  55: {
    icon: "rain",
    text: {
      bg: "силен ръмеж",
      en: "heavy drizzle",
      tr: "yoğun çisenti",
      ro: "burniță puternică",
    },
  },
  56: {
    icon: "rain",
    text: {
      bg: "леден ръмеж",
      en: "freezing drizzle",
      tr: "dondurucu çisenti",
      ro: "burniță înghețată",
    },
  },
  57: {
    icon: "rain",
    text: {
      bg: "силен леден ръмеж",
      en: "heavy freezing drizzle",
      tr: "yoğun dondurucu çisenti",
      ro: "burniță înghețată puternică",
    },
  },
  61: {
    icon: "rain",
    text: {
      bg: "слаб дъжд",
      en: "light rain",
      tr: "hafif yağmur",
      ro: "ploaie slabă",
    },
  },
  63: {
    icon: "rain",
    text: {
      bg: "дъжд",
      en: "rain",
      tr: "yağmur",
      ro: "ploaie",
    },
  },
  65: {
    icon: "rain",
    text: {
      bg: "силен дъжд",
      en: "heavy rain",
      tr: "şiddetli yağmur",
      ro: "ploaie puternică",
    },
  },
  66: {
    icon: "rain",
    text: {
      bg: "леден дъжд",
      en: "freezing rain",
      tr: "dondurucu yağmur",
      ro: "ploaie înghețată",
    },
  },
  67: {
    icon: "rain",
    text: {
      bg: "силен леден дъжд",
      en: "heavy freezing rain",
      tr: "yoğun dondurucu yağmur",
      ro: "ploaie înghețată puternică",
    },
  },
  71: {
    icon: "snow",
    text: {
      bg: "слаб сняг",
      en: "light snow",
      tr: "hafif kar",
      ro: "ninsoare slabă",
    },
  },
  73: {
    icon: "snow",
    text: {
      bg: "сняг",
      en: "snow",
      tr: "kar",
      ro: "ninsoare",
    },
  },
  75: {
    icon: "snow",
    text: {
      bg: "силен сняг",
      en: "heavy snow",
      tr: "yoğun kar",
      ro: "ninsoare abundentă",
    },
  },
  77: {
    icon: "snow",
    text: {
      bg: "снежни зърна",
      en: "snow grains",
      tr: "kar taneleri",
      ro: "granule de zăpadă",
    },
  },
  80: {
    icon: "drizzle",
    text: {
      bg: "кратковременен дъжд",
      en: "rain showers",
      tr: "sağanak",
      ro: "averse",
    },
  },
  81: {
    icon: "rain",
    text: {
      bg: "дъжд",
      en: "rain showers",
      tr: "sağanak yağmur",
      ro: "averse de ploaie",
    },
  },
  82: {
    icon: "storm",
    text: {
      bg: "ливен дъжд",
      en: "violent rain showers",
      tr: "şiddetli sağanak",
      ro: "averse torențiale",
    },
  },
  85: {
    icon: "snow",
    text: {
      bg: "слаб сняг",
      en: "snow showers",
      tr: "hafif kar yağışı",
      ro: "ninsoare slabă",
    },
  },
  86: {
    icon: "snow",
    text: {
      bg: "силен сняг",
      en: "heavy snow showers",
      tr: "yoğun kar yağışı",
      ro: "ninsoare puternică",
    },
  },
  95: {
    icon: "storm",
    text: {
      bg: "гръмотевици",
      en: "thunderstorm",
      tr: "gök gürültülü fırtına",
      ro: "furtună",
    },
  },
  96: {
    icon: "storm",
    text: {
      bg: "гръмотевици с град",
      en: "thunderstorm with hail",
      tr: "doluyla gök gürültülü fırtına",
      ro: "furtună cu grindină",
    },
  },
  99: {
    icon: "storm",
    text: {
      bg: "силни гръмотевици с град",
      en: "severe thunderstorm with hail",
      tr: "şiddetli dolu fırtınası",
      ro: "furtună puternică cu grindină",
    },
  },
};

function entry(code: number) {
  return (
    WMO[code] ?? {
      icon: "unknown" as WeatherGlyph,
      text: UNKNOWN,
    }
  );
}

export function weatherCondition(code: number, locale: Locale = "bg"): string {
  return pickText(locale, entry(code).text);
}

export function wmoToWeather(code: number) {
  const row = entry(code);
  return {
    condition: row.text.bg,
    icon: row.icon,
  };
}