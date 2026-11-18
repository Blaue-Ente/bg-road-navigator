import { describe, expect, it } from "vitest";
import { checklistPlanKey, pdfGroupsWithChecks, tripPdfInputFromPlan } from "@/lib/pdf/plan-pdf";
import type { PlanPdfLabels } from "@/lib/pdf/plan-pdf";
import type { TripPlannerResult } from "@/lib/planner/types";

const labels: PlanPdfLabels = {
  checklistTitle: "Чек лист",
  checklistHint: "Отбележи",
  groupCharges: "Винетки",
  groupDocuments: "Документи",
  groupWinter: "Зима",
  groupKit: "Комплект",
  groupPrep: "Подготовка",
  stops: "Спирки",
  border: "Граница",
  weather: "Време",
  sleepWhere: "Нощувка",
  sleepCheck: "Провери",
  aiFootnote: "ИИ",
  plainFootnote: "Без ИИ",
  distanceUnit: "км",
  drivingWord: "шофиране",
  arrivalWord: "пристигане",
};

function plan(): TripPlannerResult {
  return {
    depart_at: "2026-12-19T07:00:00.000Z",
    route: {
      origin: { label: "Берлин" },
      destination: { label: "Бугун" },
      distance_km: 1535,
      duration_min: 895,
      total_min: 910,
      arrive_at: "2026-12-20T07:25:00.000Z",
    },
    stops: [
      {
        id: "stop-1",
        kinds: ["rest"],
        title: "Почивка",
        reason: "След два часа.",
        place_name: "Am Nöthnitzgrund",
        eta: "2026-12-19T09:00:00.000Z",
        optional: false,
      },
    ],
    border: { chosen: null, note: "" },
    weather: { segments: [], warnings: [] },
    checklist: {
      vignettes: [{ id: "v-bg", title: "Винетка", detail: "Е-винетка", country_code: "BG", href: null }],
      toll_sections: [],
      documents: [{ id: "id", title: "Лична карта", detail: "", country_code: null, href: null }],
      winter: [],
      kit: [],
      prep: [],
    },
  } as unknown as TripPlannerResult;
}

describe("plan pdf content", () => {
  it("keeps one key for the same trip, however often it is replanned", () => {
    const first = checklistPlanKey(plan());
    const later = { ...plan(), depart_at: "2026-12-19T08:30:00.000Z" };
    expect(checklistPlanKey(later)).toBe(first);
    expect(first.length).toBeLessThanOrEqual(64);
    const other = {
      ...plan(),
      route: { ...plan().route, destination: { label: "Варна" } },
    } as unknown as TripPlannerResult;
    expect(checklistPlanKey(other)).not.toBe(first);
  });

  it("without the AI text, page one lists the stops from the plan", () => {
    const input = tripPdfInputFromPlan({
      plan: plan(),
      guide: null,
      checks: { id: true },
      labels,
      locale: "bg-BG",
      duration: (minutes) => `${Math.round(minutes / 60)} ч`,
    });
    expect(input.sections[0]?.heading).toBe("Спирки");
    expect(input.sections[0]?.text).toContain("Am Nöthnitzgrund");
    expect(input.footnote).toBe("Без ИИ");
    const documents = input.checklist.find((group) => group.title === "Документи");
    expect(documents?.items[0]?.checked).toBe(true);
    // Groups with nothing in them are left out.
    expect(input.checklist.map((group) => group.title)).toEqual(["Винетки", "Документи"]);
  });

  it("with the AI text, uses its title, sections and where to sleep", () => {
    const input = tripPdfInputFromPlan({
      plan: plan(),
      guide: {
        title: "Берлин – Бугун",
        intro: "Дълъг път.",
        sections: [{ heading: "Ден 1", text: "Тръгване в 08:00." }],
        overnight: [{ stop_id: "stop-1", where: "Арад", why: "Половината път.", check: ["паркинг"] }],
        closing: "Приятно пътуване!",
      },
      checks: {},
      labels,
      locale: "bg-BG",
      duration: () => "15 ч",
    });
    expect(input.title).toBe("Берлин – Бугун");
    expect(input.sections).toHaveLength(1);
    expect(input.overnight[0]?.heading).toBe("Нощувка: Арад");
    expect(input.overnight[0]?.lines.join(" ")).toContain("паркинг");
    expect(input.footnote).toBe("ИИ");
  });

  it("marks only the ticked items", () => {
    const groups = pdfGroupsWithChecks(
      [{ id: "g", title: "Група", items: [{ id: "a", title: "A", detail: "" }, { id: "b", title: "B", detail: "" }] }],
      { a: true }
    );
    expect(groups[0]?.items.map((item) => item.checked)).toEqual([true, false]);
  });
});
