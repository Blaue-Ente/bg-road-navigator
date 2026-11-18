// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildTripPdf, wrapText, type TripPdfInput } from "@/lib/pdf/trip-pdf";

const fonts = {
  regular: readFileSync("public/fonts/LiberationSans-Regular.ttf"),
  bold: readFileSync("public/fonts/LiberationSans-Bold.ttf"),
};

const paragraph =
  "Тръгвате в 08:00 от Берлин и до обяд сте при чешката граница. Първата почивка е след около два часа, защото с дете на девет години планът държи по-чести спирки. ";

export function sample(overrides: Partial<TripPdfInput> = {}): TripPdfInput {
  return {
    title: "Берлин – Бугун, 19–20 декември",
    subtitle: "1535 км · 14 ч 55 мин шофиране · 2 възрастни, 1 дете, куче",
    intro: paragraph.repeat(2),
    sections: Array.from({ length: 6 }, (_, index) => ({
      heading: `Ден ${index + 1}`,
      text: paragraph.repeat(3),
    })),
    overnight: [
      { heading: "Нощувка: Арад", lines: ["Район за търсене: Арад.", "Провери: паркинг, куче."] },
    ],
    closing: "Приятно пътуване!",
    footnote: "Текстът е написан с ИИ от данните на плана.",
    checklistTitle: "Чек лист за пътуването",
    checklistHint: "Отбележи готовото.",
    checklist: [
      {
        title: "Документи",
        items: Array.from({ length: 6 }, (_, index) => ({
          title: `Документ ${index + 1}`,
          detail: "Валиден документ за самоличност за шофьора и пътниците.",
          checked: index % 2 === 0,
        })),
      },
      {
        title: "Подготовка за пътя",
        items: Array.from({ length: 14 }, (_, index) => ({
          title: `Подготовка ${index + 1}`,
          detail: "Налягане и протектор на гумите, масло, течност за чистачки, светлини.",
          checked: false,
        })),
      },
    ],
    ...overrides,
  };
}

describe("trip pdf", () => {
  it("puts the plan on one page and the checklist on the next", async () => {
    const bytes = await buildTripPdf(sample(), fonts);
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it("adds pages only when the text really cannot fit", async () => {
    const long = sample({
      sections: Array.from({ length: 14 }, (_, index) => ({
        heading: `Раздел ${index + 1}`,
        text: paragraph.repeat(8),
      })),
    });
    const doc = await PDFDocument.load(await buildTripPdf(long, fonts));
    expect(doc.getPageCount()).toBeGreaterThan(2);
  });

  it("wraps text to the width and breaks a word that is too long", () => {
    const measure = (value: string) => value.length * 5;
    expect(wrapText("aa bb cc dd", 30, measure)).toEqual(["aa bb", "cc dd"]);
    expect(wrapText("abcdefghijkl", 30, measure)).toEqual(["abcdef", "ghijkl"]);
    expect(wrapText("one\n\ntwo", 100, measure)).toEqual(["one", "", "two"]);
  });
});

describe("checklist-only pdf", () => {
  it("is a single page when there is no written plan", async () => {
    const doc = await PDFDocument.load(
      await buildTripPdf(sample({ intro: "", sections: [], overnight: [], closing: "" }), fonts)
    );
    expect(doc.getPageCount()).toBe(1);
  });
});
