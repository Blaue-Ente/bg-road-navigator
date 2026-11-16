import { MFA_TRAVEL_ADVICE_URL } from "@/lib/constants/border-official-links";
import {
  WINTER_RULES,
  WINTER_RULES_DISCLAIMER_BG,
} from "@/lib/constants/winter-rules";
import {
  formatVignetteValidity,
  type VignetteLink,
} from "@/lib/constants/vignettes";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import { pickI18nText, pickText } from "@/lib/i18n/localized-field";
import { BG_ROAD_SAFETY } from "@/lib/i18n/bg-road-safety";
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
    documents.push({
      id: "mfa-advice",
      title: c.mfaAdvice,
      detail: c.mfaAdviceDetail,
      country_code: null,
      href: MFA_TRAVEL_ADVICE_URL,
      link_label: c.travelAdvice,
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
    const ruleName = pickI18nText(locale, {
      i18n: rule.name_i18n,
      bg: rule.name_bg,
    });
    winter.push({
      id: `winter-${code}`,
      title: formatTemplate(c.winterTitle, { rule: ruleName }),
      detail: active
        ? formatTemplate(c.winterInSeason, {
            summary: rule.summary_bg,
            period: rule.period_bg,
            chains: rule.chains_bg,
          })
        : formatTemplate(c.winterOffSeason, {
            period: rule.period_bg,
            summary: rule.summary_bg,
          }),
      country_code: code,
      href: null,
    });
  }
  if (winter.length > 0) {
    winter.push({
      id: "winter-disclaimer",
      title: c.winterDisclaimerTitle,
      detail: WINTER_RULES_DISCLAIMER_BG,
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

  return {
    vignettes,
    toll_sections: tolls,
    documents,
    winter,
    kit,
    ...safetyBlock(input.countries, locale),
  };
}

function safetyBlock(countries: string[], locale: Locale): {
  safety: SafetyNote[];
  safety_closing: string | null;
  bg_links: ChecklistItem[];
} {
  if (!countries.includes("BG")) {
    return { safety: [], safety_closing: null, bg_links: [] };
  }
  const safety: SafetyNote[] = [
    ...BG_ROAD_SAFETY.law.map((item) => ({ ...item, kind: "law" as const })),
    ...BG_ROAD_SAFETY.advice.map((item) => ({
      ...item,
      kind: "advice" as const,
    })),
  ];
  const closing = catalog(locale).planner.checklist.safetyClosing;
  return {
    safety,
    safety_closing: closing,
    bg_links: BG_ROAD_SAFETY.links.map((link) => ({
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