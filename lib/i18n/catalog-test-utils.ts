export const CYRILLIC = /[\u0400-\u04FF]/;

/** Whole-word leftovers from the old transliteration pipeline. */
export const EN_TRANSLIT_MARKERS =
  /\b(kato|ili|shte|za|na|po|otkazhi|ezik|fuelo|moi|savei|warningeniya|tragvane|prolazi|settingi)\b/i;