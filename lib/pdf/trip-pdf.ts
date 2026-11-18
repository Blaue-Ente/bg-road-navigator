import type { PDFFont, PDFPage } from "pdf-lib";

/** A4 in points. */
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 46;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

export interface PdfChecklistGroup {
  title: string;
  items: Array<{ title: string; detail: string; checked: boolean }>;
}

export interface TripPdfInput {
  title: string;
  /** Under the title: the route and the date. */
  subtitle: string;
  intro: string;
  sections: Array<{ heading: string; text: string }>;
  /** Where to sleep, one block per night. */
  overnight: Array<{ heading: string; lines: string[] }>;
  closing: string;
  /** Small print at the foot of the text page. */
  footnote: string;
  checklistTitle: string;
  checklistHint: string;
  checklist: PdfChecklistGroup[];
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

const INK = { r: 0.1, g: 0.12, b: 0.16 };
const MUTED = { r: 0.38, g: 0.42, b: 0.48 };
const ACCENT = { r: 0.12, g: 0.25, b: 0.69 };
const RULE = { r: 0.8, g: 0.83, b: 0.87 };
const SHADE = { r: 0.94, g: 0.95, b: 0.97 };

/** Words that fit a line, breaking a single over-long word when needed. */
export function wrapText(
  text: string,
  width: number,
  measure: (value: string) => number
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (measure(word) <= width) {
        line = word;
        continue;
      }
      let rest = word;
      while (rest && measure(rest) > width) {
        let cut = rest.length - 1;
        while (cut > 1 && measure(rest.slice(0, cut)) > width) cut -= 1;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    if (line) lines.push(line);
  }
  return lines;
}

interface Block {
  /** Height in points at the given scale; draw puts it at the top y. */
  height: (scale: number) => number;
  draw: (page: PDFPage, y: number, scale: number) => void;
}

function textBlock(
  fonts: Fonts,
  text: string,
  size: number,
  opts: { bold?: boolean; color?: typeof INK; gapAfter?: number; width?: number; x?: number } = {}
): Block {
  const font = opts.bold ? fonts.bold : fonts.regular;
  const width = opts.width ?? CONTENT_WIDTH;
  const x = opts.x ?? MARGIN;
  const lines = (scale: number) =>
    wrapText(text, width, (value) => font.widthOfTextAtSize(value, size * scale));
  return {
    height: (scale) =>
      lines(scale).length * size * scale * 1.32 + (opts.gapAfter ?? 0) * scale,
    draw: (page, y, scale) => {
      let cursor = y;
      for (const line of lines(scale)) {
        cursor -= size * scale * 1.32;
        if (line) {
          page.drawText(line, {
            x,
            y: cursor + size * scale * 0.28,
            size: size * scale,
            font,
            color: rgbOf(opts.color ?? INK),
          });
        }
      }
    },
  };
}

let rgbFactory: ((r: number, g: number, b: number) => unknown) | null = null;
function rgbOf(color: { r: number; g: number; b: number }) {
  return rgbFactory!(color.r, color.g, color.b) as ReturnType<
    typeof import("pdf-lib").rgb
  >;
}

/** The largest scale (1 down to `min`) at which the blocks fit one page body. */
function fitScale(blocks: Block[], available: number, min = 0.72): number {
  for (let scale = 1; scale >= min; scale -= 0.04) {
    const total = blocks.reduce((sum, block) => sum + block.height(scale), 0);
    if (total <= available) return scale;
  }
  return min;
}

function paginate(
  blocks: Block[],
  scale: number,
  first: number,
  rest: number
): Block[][] {
  const pages: Block[][] = [[]];
  let room = first;
  for (const block of blocks) {
    const height = block.height(scale);
    if (height > room && pages[pages.length - 1]!.length > 0) {
      pages.push([]);
      room = rest;
    }
    pages[pages.length - 1]!.push(block);
    room -= height;
  }
  return pages;
}

function drawBlocks(page: PDFPage, blocks: Block[], top: number, scale: number) {
  let y = top;
  for (const block of blocks) {
    block.draw(page, y, scale);
    y -= block.height(scale);
  }
}

function drawFooter(page: PDFPage, fonts: Fonts, left: string, number: number) {
  page.drawLine({
    start: { x: MARGIN, y: 36 },
    end: { x: PAGE.width - MARGIN, y: 36 },
    thickness: 0.5,
    color: rgbOf(RULE),
  });
  page.drawText(left.slice(0, 110), {
    x: MARGIN,
    y: 24,
    size: 7.5,
    font: fonts.regular,
    color: rgbOf(MUTED),
  });
  page.drawText(String(number), {
    x: PAGE.width - MARGIN - 6,
    y: 24,
    size: 7.5,
    font: fonts.regular,
    color: rgbOf(MUTED),
  });
}

/** One checklist group as a table: a shaded title row, then a row per item with a box. */
function checklistBlocks(fonts: Fonts, groups: PdfChecklistGroup[]): Block[] {
  const blocks: Block[] = [];
  const boxColumn = 26;
  const textWidth = CONTENT_WIDTH - boxColumn - 8;
  for (const group of groups) {
    if (group.items.length === 0) continue;
    blocks.push({
      height: (scale) => 20 * scale,
      draw: (page, y, scale) => {
        page.drawRectangle({
          x: MARGIN,
          y: y - 18 * scale,
          width: CONTENT_WIDTH,
          height: 18 * scale,
          color: rgbOf(SHADE),
          borderColor: rgbOf(RULE),
          borderWidth: 0.5,
        });
        page.drawText(group.title, {
          x: MARGIN + 8,
          y: y - 13 * scale,
          size: 9.5 * scale,
          font: fonts.bold,
          color: rgbOf(ACCENT),
        });
      },
    });
    for (const item of group.items) {
      const titleSize = 9;
      const detailSize = 7.6;
      const titleLines = (scale: number) =>
        wrapText(item.title, textWidth, (value) =>
          fonts.bold.widthOfTextAtSize(value, titleSize * scale)
        );
      const detailLines = (scale: number) =>
        item.detail
          ? wrapText(item.detail, textWidth, (value) =>
              fonts.regular.widthOfTextAtSize(value, detailSize * scale)
            ).slice(0, 3)
          : [];
      const rowHeight = (scale: number) =>
        Math.max(
          22 * scale,
          titleLines(scale).length * titleSize * scale * 1.25 +
            detailLines(scale).length * detailSize * scale * 1.25 +
            9 * scale
        );
      blocks.push({
        height: rowHeight,
        draw: (page, y, scale) => {
          const height = rowHeight(scale);
          page.drawRectangle({
            x: MARGIN,
            y: y - height,
            width: CONTENT_WIDTH,
            height,
            borderColor: rgbOf(RULE),
            borderWidth: 0.5,
          });
          const box = 11 * scale;
          const boxX = MARGIN + 8;
          const boxY = y - height / 2 - box / 2;
          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: box,
            height: box,
            borderColor: rgbOf(INK),
            borderWidth: 1,
          });
          if (item.checked) {
            page.drawLine({
              start: { x: boxX + box * 0.2, y: boxY + box * 0.5 },
              end: { x: boxX + box * 0.42, y: boxY + box * 0.2 },
              thickness: 1.6,
              color: rgbOf(ACCENT),
            });
            page.drawLine({
              start: { x: boxX + box * 0.42, y: boxY + box * 0.2 },
              end: { x: boxX + box * 0.86, y: boxY + box * 0.82 },
              thickness: 1.6,
              color: rgbOf(ACCENT),
            });
          }
          let cursor = y - 5 * scale;
          for (const line of titleLines(scale)) {
            cursor -= titleSize * scale * 1.25;
            page.drawText(line, {
              x: MARGIN + boxColumn + 8,
              y: cursor + titleSize * scale * 0.22,
              size: titleSize * scale,
              font: fonts.bold,
              color: rgbOf(INK),
            });
          }
          for (const line of detailLines(scale)) {
            cursor -= detailSize * scale * 1.25;
            page.drawText(line, {
              x: MARGIN + boxColumn + 8,
              y: cursor + detailSize * scale * 0.22,
              size: detailSize * scale,
              font: fonts.regular,
              color: rgbOf(MUTED),
            });
          }
        },
      });
    }
  }
  return blocks;
}

/**
 * The trip as a PDF: the written plan on the first page (more pages only when
 * it truly does not fit), then the checklist as a table with a box per item.
 * Fonts are passed in so the same code runs in the browser and in tests.
 */
export async function buildTripPdf(
  input: TripPdfInput,
  fontBytes: { regular: ArrayBuffer | Uint8Array; bold: ArrayBuffer | Uint8Array }
): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  rgbFactory = rgb;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(input.title);
  doc.setCreator("BG Road Navigator");
  const fonts: Fonts = {
    regular: await doc.embedFont(fontBytes.regular, { subset: true }),
    bold: await doc.embedFont(fontBytes.bold, { subset: true }),
  };

  // Page 1: the written plan.
  const text: Block[] = [
    textBlock(fonts, input.title, 19, { bold: true, color: ACCENT, gapAfter: 2 }),
    textBlock(fonts, input.subtitle, 10, { color: MUTED, gapAfter: 10 }),
  ];
  if (input.intro) text.push(textBlock(fonts, input.intro, 10.5, { gapAfter: 9 }));
  for (const section of input.sections) {
    text.push(textBlock(fonts, section.heading, 11.5, { bold: true, color: ACCENT, gapAfter: 2 }));
    text.push(textBlock(fonts, section.text, 10, { gapAfter: 8 }));
  }
  for (const night of input.overnight) {
    text.push(textBlock(fonts, night.heading, 11.5, { bold: true, color: ACCENT, gapAfter: 2 }));
    text.push(textBlock(fonts, night.lines.join("\n"), 10, { gapAfter: 8 }));
  }
  if (input.closing) {
    text.push(textBlock(fonts, input.closing, 10.5, { bold: true, gapAfter: 6 }));
  }
  if (input.footnote) {
    text.push(textBlock(fonts, input.footnote, 7.5, { color: MUTED }));
  }
  const bodyTop = PAGE.height - MARGIN;
  const bodyHeight = PAGE.height - MARGIN - 52;
  const textScale = fitScale(text, bodyHeight);
  let pageNumber = 0;
  // A checklist saved on its own has no written plan: it is just the table.
  const hasText = Boolean(input.intro) || input.sections.length > 0 || input.overnight.length > 0;
  for (const blocks of hasText ? paginate(text, textScale, bodyHeight, bodyHeight) : []) {
    const page = doc.addPage([PAGE.width, PAGE.height]);
    pageNumber += 1;
    drawBlocks(page, blocks, bodyTop, textScale);
    drawFooter(page, fonts, input.title, pageNumber);
  }

  // The checklist: a title, then the table.
  const checklist: Block[] = [
    textBlock(fonts, input.checklistTitle, 17, { bold: true, color: ACCENT, gapAfter: 2 }),
    textBlock(fonts, input.checklistHint, 8.5, { color: MUTED, gapAfter: 8 }),
    ...checklistBlocks(fonts, input.checklist),
  ];
  const checkScale = fitScale(checklist, bodyHeight, 0.6);
  for (const blocks of paginate(checklist, checkScale, bodyHeight, bodyHeight)) {
    const page = doc.addPage([PAGE.width, PAGE.height]);
    pageNumber += 1;
    drawBlocks(page, blocks, bodyTop, checkScale);
    drawFooter(page, fonts, input.title, pageNumber);
  }

  return doc.save();
}
