import { TRAVEL_ADVICE_BY_LOCALE } from "@/lib/constants/border-official-links";
import { pickText } from "@/lib/i18n/localized-field";
import {
  WINTER_RULES,
  WINTER_RULES_DISCLAIMER,
  winterRuleChains,
  winterRuleName,
  winterRulePeriod,
  winterRuleSummary,
} from "@/lib/constants/winter-rules";
import {
  formatVignetteValidity,
  type VignetteLink,
} from "@/lib/constants/vignettes";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import { roadSafetyCopy } from "@/lib/i18n/road-safety";
import type {
  ChecklistItem,
  PlanChecklist,
  SafetyNote,
} from "@/lib/planner/types";

const SEASON: Record<string, { from: number; to: number } | "conditions"> = {
  BG: { from: 11, to: 3 },
  AT: { from: 11, to: 4 },
  DE: "conditions",
  SI: { from: 11, to: 3 },
  HR: { from: 11, to: 4 },
  RO: { from: 11, to: 3 },
  HU: "conditions",
  CZ: { from: 11, to: 3 },
  SK: { from: 11, to: 3 },
  CH: "conditions",
  RS: { from: 11, to: 4 },
  MK: { from: 11, to: 3 },
  GR: "conditions",
  IT: { from: 11, to: 4 },
  FR: { from: 11, to: 3 },
};

const FIRST_AID = new Set(["AT", "HU", "CZ", "SK", "SI", "HR", "BG"]);

const EU_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

const CITIZENSHIP_NOTE_MARKETS = new Set(["TR", "RS", "MK"]);

const PET_PASSPORT_URL =
  "https://food.ec.europa.eu/animals/movement-pets_en";

export function buildChecklist(input: {
  locale?: Locale;
  countries: string[];
  departAt: Date;
  withPet: boolean;
  withChildren: boolean;
  childrenAges: number[];
  tolls: VignetteLink[];
  /** True when the plan has a night away, so a booking is part of the preparation. */
  hasOvernight?: boolean;
}): PlanChecklist {
  const locale = input.locale ?? "bg";
  const c = catalog(locale).planner.checklist;
  const month = input.departAt.getUTCMonth() + 1;
  const vignettes: ChecklistItem[] = [];
  const tolls: ChecklistItem[] = [];
  for (const link of input.tolls) {
    const validity = formatVignetteValidity(link, locale);
    const name = pickText(locale, link.name);
    const notes = link.notes
      ? pickText(locale, link.notes)
      : link.notes_bg?.trim() || undefined;
    const item: ChecklistItem = {
      id: `${link.kind}-${link.country_code}`,
      title: name,
      detail: [notes ?? link.name_en, validity]
        .filter(Boolean)
        .join(" "),
      country_code: link.country_code,
      href: link.official_url,
      link_role: link.link_role,
      charge_kind: link.kind,
      link_label:
        link.link_role === "info" ? c.officialInfo : c.officialShop,
      validity_bg: link.validity_bg ?? null,
      checked_on: link.checked_on ?? null,
    };
    if (link.kind === "distance_toll") tolls.push(item);
    else vignettes.push(item);
  }

  const documents: ChecklistItem[] = [
    {
      id: "id",
      title: c.idTitle,
      detail: c.idDetail,
      country_code: null,
      href: null,
    },
    {
      id: "licence",
      title: c.licenceTitle,
      detail: c.licenceDetail,
      country_code: null,
      href: null,
    },
  ];
  if (input.countries.includes("TR")) {
    documents.push({
      id: "tr-documents",
      title: c.turkeyDocsTitle,
      detail: c.turkeyDocsDetail,
      country_code: "TR",
      href: null,
    });
  } else if (input.countries.some((code) => code !== "BG")) {
    documents.push({
      id: "green-card",
      title: c.insuranceAbroad,
      detail: c.insuranceAbroadDetail,
      country_code: null,
      href: null,
    });
  }
  if (input.countries.some((code) => code !== "BG")) {
    const travel = TRAVEL_ADVICE_BY_LOCALE[locale];
    documents.push({
      id: "mfa-advice",
      title: pickText(locale, travel.title),
      detail: pickText(locale, travel.detail),
      country_code: null,
      href: travel.href,
      link_label: pickText(locale, travel.link_label),
    });
  }
  if (input.withPet) {
    documents.push({
      id: "pet-passport",
      title: c.petPassport,
      detail: c.petPassportDetail,
      country_code: null,
      href: PET_PASSPORT_URL,
      link_label: c.petEuRules,
    });
  }
  if (needsCitizenshipNote(input.countries)) {
    documents.push({
      id: "citizenship-docs",
      title: c.citizenshipDocs,
      detail: c.citizenshipDocsDetail,
      country_code: null,
      href: null,
    });
  }
  if (input.withChildren) {
    const youngest =
      input.childrenAges.length === 0 ? null : Math.min(...input.childrenAges);
    documents.push({
      id: "child-seat",
      title: c.childSeat,
      detail:
        youngest != null && youngest < 12
          ? formatTemplate(c.childSeatYoung, { age: String(youngest) })
          : c.childSeatGeneric,
      country_code: null,
      href: null,
    });
  }

  const winter: ChecklistItem[] = [];
  for (const code of input.countries) {
    const rule = WINTER_RULES.find((item) => item.country_code === code);
    if (!rule) continue;
    const active = inSeason(code, month);
    const ruleName = winterRuleName(locale, rule);
    const summary = winterRuleSummary(locale, rule);
    const period = winterRulePeriod(locale, rule);
    const chains = winterRuleChains(locale, rule);
    winter.push({
      id: `winter-${code}`,
      title: formatTemplate(c.winterTitle, { rule: ruleName }),
      detail: active
        ? formatTemplate(c.winterInSeason, {
            summary,
            period,
            chains,
          })
        : formatTemplate(c.winterOffSeason, {
            period,
            summary,
          }),
      country_code: code,
      href: null,
    });
  }
  if (winter.length > 0) {
    winter.push({
      id: "winter-disclaimer",
      title: c.winterDisclaimerTitle,
      detail: pickText(locale, WINTER_RULES_DISCLAIMER),
      country_code: null,
      href: null,
    });
  }

  const kit: ChecklistItem[] = [
    {
      id: "vest",
      title: c.vest,
      detail: c.vestDetail,
      country_code: null,
      href: null,
    },
    {
      id: "triangle",
      title: c.triangle,
      detail: c.triangleDetail,
      country_code: null,
      href: null,
    },
  ];
  if (input.countries.some((code) => FIRST_AID.has(code))) {
    kit.push({
      id: "first-aid",
      title: c.firstAid,
      detail: c.firstAidDetail,
      country_code: null,
      href: null,
    });
  }

  const prep = prepItems(input, c);

  return {
    vignettes,
    toll_sections: tolls,
    documents,
    winter,
    kit,
    prep,
    ...safetyBlock(input.countries, locale),
  };
}

const CURRENCY: Record<string, string> = {
  RO: "RON",
  HU: "HUF",
  RS: "RSD",
  MK: "MKD",
  TR: "TRY",
  PL: "PLN",
  CZ: "CZK",
  CH: "CHF",
  BG: "EUR",
};

type ChecklistCopy = ReturnType<typeof catalog>["planner"]["checklist"];

/** What to bring and arrange, shaped by who travels and what the route needs. */
function prepItems(
  input: {
    countries: string[];
    withPet: boolean;
    withChildren: boolean;
    hasOvernight?: boolean;
  },
  c: ChecklistCopy
): ChecklistItem[] {
  const item = (id: string, title: string, detail: string): ChecklistItem => ({
    id: `prep-${id}`,
    title,
    detail,
    country_code: null,
    href: null,
  });
  const out: ChecklistItem[] = [item("car", c.prepCar, c.prepCarDetail)];
  if (input.hasOvernight) {
    out.push(item("booking", c.prepBooking, c.prepBookingDetail));
  }
  out.push(
    item("food", c.prepFood, c.prepFoodDetail),
    item("wipes", c.prepWipes, c.prepWipesDetail)
  );
  const currencies = [
    ...new Set(
      input.countries
        .map((code) => CURRENCY[code.toUpperCase()])
        .filter((code): code is string => Boolean(code))
    ),
  ];
  if (currencies.length > 0) {
    out.push(
      item(
        "cash",
        c.prepCash,
        formatTemplate(c.prepCashDetail, { currencies: currencies.join(", ") })
      )
    );
  }
  out.push(item("gifts", c.prepGifts, c.prepGiftsDetail));
  if (input.countries.some((code) => code.toUpperCase() === "BG")) {
    out.push(item("jars", c.prepJars, c.prepJarsDetail));
  }
  out.push(
    item("phone", c.prepPhone, c.prepPhoneDetail),
    item("meds", c.prepMeds, c.prepMedsDetail)
  );
  if (input.withChildren) out.push(item("child", c.prepChild, c.prepChildDetail));
  if (input.withPet) out.push(item("pet", c.prepPet, c.prepPetDetail));
  return out;
}

function safetyBlock(countries: string[], locale: Locale): {
  safety: SafetyNote[];
  safety_closing: string | null;
  bg_links: ChecklistItem[];
} {
  if (!countries.includes("BG")) {
    return { safety: [], safety_closing: null, bg_links: [] };
  }
  const block = roadSafetyCopy(locale);
  const safety: SafetyNote[] = [
    ...block.law.map((item) => ({ ...item, kind: "law" as const })),
    ...block.advice.map((item) => ({
      ...item,
      kind: "advice" as const,
    })),
  ];
  return {
    safety,
    safety_closing: block.closing,
    bg_links: block.links.map((link) => ({
      id: link.id,
      title: link.title,
      detail: link.detail,
      country_code: "BG",
      href: link.href,
      link_label: link.link_label,
    })),
  };
}

function needsCitizenshipNote(countries: string[]): boolean {
  const codes = countries.map((code) => code.trim().toUpperCase());
  if (codes.some((code) => CITIZENSHIP_NOTE_MARKETS.has(code))) return true;
  return codes.some((code) => code.length === 2 && !EU_CODES.has(code));
}

function inSeason(code: string, month: number): boolean {
  const season = SEASON[code];
  if (!season || season === "conditions") {
    return month >= 11 || month <= 3;
  }
  if (season.from <= season.to) {
    return month >= season.from && month <= season.to;
  }
  return month >= season.from || month <= season.to;
}