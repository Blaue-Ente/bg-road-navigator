import {
  WINTER_RULES,
  WINTER_RULES_DISCLAIMER_BG,
} from "@/lib/constants/winter-rules";
import type { VignetteLink } from "@/lib/constants/vignettes";
import type { ChecklistItem, PlanChecklist } from "@/lib/planner/types";

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

export function buildChecklist(input: {
  countries: string[];
  departAt: Date;
  withPet: boolean;
  withChildren: boolean;
  childrenAges: number[];
  tolls: VignetteLink[];
}): PlanChecklist {
  const month = input.departAt.getUTCMonth() + 1;
  const vignettes: ChecklistItem[] = [];
  const tolls: ChecklistItem[] = [];
  for (const link of input.tolls) {
    const item: ChecklistItem = {
      id: `${link.kind}-${link.country_code}`,
      title: link.name_bg,
      detail: link.notes_bg ?? link.name_en,
      country_code: link.country_code,
      href: link.official_url,
    };
    if (link.kind === "distance_toll") tolls.push(item);
    else vignettes.push(item);
  }

  const documents: ChecklistItem[] = [
    {
      id: "id",
      title: "Лична карта или паспорт",
      detail: "Валиден документ за самоличност за шофьора и пътниците.",
      country_code: null,
      href: null,
    },
    {
      id: "licence",
      title: "Свидетелство за управление",
      detail: "Националното свидетелство е достатъчно в ЕС. Извън ЕС носете и международно, ако се изисква.",
      country_code: null,
      href: null,
    },
  ];
  if (input.countries.includes("TR")) {
    documents.push({
      id: "tr-documents",
      title: "Турция: лична карта и зелена карта",
      detail:
        "На Капитан Андреево носете паспорт или лична карта и зелена карта (застраховка), валидна за TR.",
      country_code: "TR",
      href: null,
    });
  } else if (input.countries.some((code) => code !== "BG")) {
    documents.push({
      id: "green-card",
      title: "Застраховка извън България",
      detail:
        "Проверете дали гражданската отговорност покрива държавите по пътя. Зелена карта е нужна там, където полицата не важи.",
      country_code: null,
      href: null,
    });
  }
  if (input.withPet) {
    documents.push({
      id: "pet-passport",
      title: "Ветеринарен паспорт на любимеца",
      detail:
        "ЕС паспорт, микрочип и валидна ваксина срещу бяс. За Турция и други страни извън ЕС проверете допълнителните условия.",
      country_code: null,
      href: null,
    });
  }
  if (input.withChildren) {
    const youngest =
      input.childrenAges.length === 0
        ? null
        : Math.min(...input.childrenAges);
    documents.push({
      id: "child-seat",
      title: "Детско столче",
      detail:
        youngest != null && youngest < 12
          ? `Дете на ${youngest} г. пътува в столче или седалка според ръста. В ЕС столче е задължително под 135 см или 12 години.`
          : "Деца под 135 см или 12 години пътуват в столче. Проверете правилото във всяка държава по пътя.",
      country_code: null,
      href: null,
    });
  }

  const winter: ChecklistItem[] = [];
  for (const code of input.countries) {
    const rule = WINTER_RULES.find((item) => item.country_code === code);
    if (!rule) continue;
    const active = inSeason(code, month);
    winter.push({
      id: `winter-${code}`,
      title: `${rule.name_bg}: зимно оборудване`,
      detail: active
        ? `${rule.summary_bg} ${rule.period_bg}. ${rule.chains_bg}`
        : `Извън обичайния сезон (${rule.period_bg}). ${rule.summary_bg}`,
      country_code: code,
      href: null,
    });
  }
  if (winter.length > 0) {
    winter.push({
      id: "winter-disclaimer",
      title: "Проверете преди тръгване",
      detail: WINTER_RULES_DISCLAIMER_BG,
      country_code: null,
      href: null,
    });
  }

  const kit: ChecklistItem[] = [
    {
      id: "vest",
      title: "Светлоотразителна жилетка",
      detail: "По една за всеки пътник в много държави, включително България.",
      country_code: null,
      href: null,
    },
    {
      id: "triangle",
      title: "Предупредителен триъгълник",
      detail: "Задължителен в багажника.",
      country_code: null,
      href: null,
    },
  ];
  if (input.countries.some((code) => FIRST_AID.has(code))) {
    kit.push({
      id: "first-aid",
      title: "Аптечка",
      detail:
        "Аптечка е задължителна или силно очаквана в част от държавите по този път.",
      country_code: null,
      href: null,
    });
  }

  return { vignettes, toll_sections: tolls, documents, winter, kit };
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
