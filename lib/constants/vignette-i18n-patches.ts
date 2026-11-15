import type { Locale } from "@/lib/i18n/locale";

type Localized = Partial<Record<Locale, string>>;

/** Driver-facing vignette copy; `name_bg` / `notes_bg` stay the Bulgarian source of truth. */
export const VIGNETTE_NAME_I18N: Record<string, Localized> = {
  BG: {
    tr: "Bulgaristan — elektronik vinyet",
    ro: "Bulgaria — rovinietă electronică",
  },
  AT: { tr: "Avusturya ASFINAG vinyeti", ro: "Austria — vignetă ASFINAG" },
  HU: {
    tr: "Macaristan e-vinyet / HU-GO",
    ro: "Ungaria — e-rovinieta / HU-GO",
  },
  CH: { tr: "İsviçre e-vinyeti", ro: "Elveția — e-vignetă" },
  SI: { tr: "Slovenya e-vinyeti", ro: "Slovenia — e-rovinieta" },
  CZ: { tr: "Çekya e-vinyeti", ro: "Cehia — e-vignetă" },
  SK: { tr: "Slovakya eznamka", ro: "Slovacia — eznamka" },
  RO: { tr: "Romanya rovinieta", ro: "România — rovinietă" },
  RS: { tr: "Sırbistan kilometre bazlı geçiş", ro: "Serbia — taxă pe km" },
  HR: { tr: "Hırvatistan kilometre bazlı geçiş", ro: "Croația — taxă pe km" },
  TR: { tr: "Türkiye HGS geçişi", ro: "Turcia — taxă HGS" },
};

export const VIGNETTE_NOTES_I18N: Record<string, Localized> = {
  RS: {
    en: "No vignette. Motorways are paid per kilometre at barriers.",
    tr: "Vinyet yok. Otoyollar bariyerlerde kilometre başına ücretlidir.",
    ro: "Fără rovinietă. Autostrăzile se plătesc pe kilometru la barieră.",
  },
  HR: {
    en: "No vignette for cars. Tolls are charged per kilometre.",
    tr: "Binek araçlar için vinyet yok. Geçiş ücreti kilometre başına alınır.",
    ro: "Fără rovinietă pentru autoturisme. Taxa se plătește pe kilometru.",
  },
  TR: {
    en: "No vignette. Register foreign plates with HGS (PTT) before travel.",
    tr: "Vinyet yok. Yabancı plakaları yola çıkmadan önce HGS (PTT) ile kaydedin.",
    ro: "Fără rovinietă. Înregistrați plăcuțele străine la HGS (PTT) înainte de drum.",
  },
  BG: {
    en: "Buy the e-vignette on the official toll shop before entering tolled roads.",
    tr: "Ücretli yollara girmeden önce resmî e-vinyeti alın.",
    ro: "Cumpărați e-rovinieta din magazinul oficial înainte de drumurile cu taxă.",
  },
  RO: {
    en: "Buy the rovinieta via the official eToll portal.",
    tr: "Rovinietayı resmî eToll portalından alın.",
    ro: "Cumpărați rovinieta din portalul oficial eToll.",
  },
};