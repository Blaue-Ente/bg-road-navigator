import { inflateRawSync } from "node:zlib";

/**
 * European Commission Weekly Oil Bulletin, prices with taxes.
 * Euro-super 95 is stored as petrol. Bulgaria uses this EC figure (no KARAI).
 * The bulletin quotes euro per 1 000 litres when the numbers are large.
 */

export interface BulletinPrice {
  countryCode: string;
  fuel: "petrol" | "diesel";
  eurPerLitre: number;
  week: string;
}

const BULLETIN_PAGE =
  "https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en";
const LEGACY_XLSX =
  "https://ec.europa.eu/energy/observatory/reports/latest_prices_with_taxes.xlsx";

const COUNTRY_CODES: Record<string, string> = {
  austria: "AT",
  belgium: "BE",
  bulgaria: "BG",
  croatia: "HR",
  cyprus: "CY",
  czechia: "CZ",
  "czech republic": "CZ",
  denmark: "DK",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  germany: "DE",
  greece: "GR",
  hungary: "HU",
  ireland: "IE",
  italy: "IT",
  latvia: "LV",
  lithuania: "LT",
  luxembourg: "LU",
  malta: "MT",
  netherlands: "NL",
  "the netherlands": "NL",
  poland: "PL",
  portugal: "PT",
  romania: "RO",
  slovakia: "SK",
  slovenia: "SI",
  spain: "ES",
  sweden: "SE",
};

export function bulletinLinkFromHtml(html: string): string | null {
  const hrefs = [...html.matchAll(/href="([^"]+\.xlsx[^"]*)"/gi)].map(
    (match) => match[1] ?? ""
  );
  const preferred =
    hrefs.find((href) => /tax/i.test(href) && /price/i.test(href)) ??
    hrefs.find((href) => /oil|bulletin|price/i.test(href)) ??
    hrefs[0];
  if (!preferred) return null;
  if (preferred.startsWith("http")) return preferred;
  return new URL(preferred, BULLETIN_PAGE).href;
}

export function parseOilBulletin(
  body: Buffer,
  contentType: string,
  fallbackWeek: string
): BulletinPrice[] {
  const head = body.subarray(0, 200).toString("utf8").trimStart();
  const isZip = body.length > 4 && body[0] === 0x50 && body[1] === 0x4b;
  if (
    !isZip &&
    (contentType.includes("csv") ||
      contentType.includes("text") ||
      /^[\w";,]/.test(head))
  ) {
    return parseOilBulletinCsv(body.toString("utf8"), fallbackWeek);
  }
  return parseOilBulletinXlsx(body, fallbackWeek);
}

export function parseOilBulletinCsv(
  text: string,
  fallbackWeek: string
): BulletinPrice[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = (lines[0]?.match(/;/g)?.length ?? 0) > (lines[0]?.match(/,/g)?.length ?? 0)
    ? ";"
    : ",";
  const rows = lines.map((line) => splitCsv(line, delimiter));
  return parseBulletinTable(rows, fallbackWeek);
}

export function parseBulletinTable(
  rows: string[][],
  fallbackWeek: string
): BulletinPrice[] {
  const headerIndex = rows.findIndex((row) => columnMap(row) != null);
  if (headerIndex < 0) return [];
  const header = rows[headerIndex] ?? [];
  const columns = columnMap(header);
  if (!columns) return [];
  const weekFromHeader = weekInRows(rows.slice(0, headerIndex + 1));
  const prices: BulletinPrice[] = [];
  const rawRows: Array<{
    country: string;
    petrol: number;
    diesel: number;
    week: string;
  }> = [];

  for (const row of rows.slice(headerIndex + 1)) {
    const country = countryCode(row[columns.country] ?? "");
    if (!country) continue;
    const petrol = numberOrNull(row[columns.petrol] ?? "");
    const diesel = numberOrNull(row[columns.diesel] ?? "");
    if (petrol == null && diesel == null) continue;
    const week =
      (columns.week == null ? null : parseWeek(row[columns.week] ?? "")) ??
      weekFromHeader ??
      fallbackWeek;
    rawRows.push({
      country,
      petrol: petrol ?? Number.NaN,
      diesel: diesel ?? Number.NaN,
      week,
    });
  }

  const samples = rawRows.flatMap((row) =>
    [row.petrol, row.diesel].filter((value) => Number.isFinite(value))
  );
  const perThousand = samples.some((value) => value > 20);
  for (const row of rawRows) {
    pushPrice(prices, row.country, "petrol", row.petrol, row.week, perThousand);
    pushPrice(prices, row.country, "diesel", row.diesel, row.week, perThousand);
  }
  return prices;
}

export function parseOilBulletinXlsx(
  buffer: Buffer,
  fallbackWeek: string
): BulletinPrice[] {
  const files = unzip(buffer);
  const shared = decodeSharedStrings(files.get("xl/sharedStrings.xml"));
  const sheetName = [...files.keys()]
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/u.test(name))
    .sort()[0];
  if (!sheetName) return [];
  const sheet = files.get(sheetName);
  if (!sheet) return [];
  return parseBulletinTable(rowsFromSheet(sheet.toString("utf8"), shared), fallbackWeek);
}

export async function downloadOilBulletin(deps: {
  fetchImpl?: typeof fetch;
  now?: Date;
  pageUrl?: string;
}): Promise<{ body: Buffer; contentType: string; week: string } | null> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const week = isoWeek(deps.now ?? new Date());
  const override = process.env.OIL_BULLETIN_URL?.trim();
  const pageUrl = deps.pageUrl ?? BULLETIN_PAGE;
  let fileUrl = override || "";
  if (!fileUrl) {
    try {
      const page = await fetchImpl(pageUrl, {
        headers: { Accept: "text/html" },
        redirect: "follow",
      });
      if (page.ok) {
        fileUrl = bulletinLinkFromHtml(await page.text()) ?? "";
      }
    } catch {
      fileUrl = "";
    }
  }
  if (!fileUrl) fileUrl = LEGACY_XLSX;
  try {
    const file = await fetchImpl(fileUrl, { redirect: "follow" });
    if (!file.ok) return null;
    const body = Buffer.from(await file.arrayBuffer());
    return {
      body,
      contentType: file.headers.get("content-type") ?? "",
      week,
    };
  } catch {
    return null;
  }
}

function columnMap(
  header: string[]
): { country: number; petrol: number; diesel: number; week: number | null } | null {
  const cells = header.map((cell) => cell.trim().toLowerCase());
  const petrol = cells.findIndex((cell) =>
    /euro-?super\s*95|euro super 95|e95|unleaded.*95|gasoline 95/.test(cell)
  );
  const diesel = cells.findIndex((cell) =>
    /diesel|gas oil|gasoil|automotive gas/.test(cell)
  );
  if (petrol < 0 || diesel < 0) return null;
  const country = cells.findIndex((cell) =>
    /country|\u0434\u044A\u0440\u0436\u0430\u0432\u0430|member/i.test(cell)
  );
  const week = cells.findIndex((cell) => /week|date|reference/.test(cell));
  return {
    country: country >= 0 ? country : 0,
    petrol,
    diesel,
    week: week >= 0 ? week : null,
  };
}

function countryCode(value: string): string | null {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key || key.includes("euro area") || key.includes("european union")) {
    return null;
  }
  return COUNTRY_CODES[key] ?? null;
}

function numberOrNull(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  if (!cleaned || cleaned === "-" || cleaned === "n/a") return null;
  const parsed = Number(cleaned.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function pushPrice(
  prices: BulletinPrice[],
  countryCode: string,
  fuel: BulletinPrice["fuel"],
  raw: number,
  week: string,
  perThousand: boolean
) {
  if (!Number.isFinite(raw)) return;
  const eur = perThousand ? raw / 1000 : raw;
  if (eur < 0.4 || eur > 5) return;
  prices.push({
    countryCode,
    fuel,
    eurPerLitre: Math.round(eur * 1000) / 1000,
    week,
  });
}

function weekInRows(rows: string[][]): string | null {
  for (const row of rows) {
    for (const cell of row) {
      const week = parseWeek(cell);
      if (week) return week;
    }
  }
  return null;
}

function parseWeek(value: string): string | null {
  const iso = value.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = value.match(/(\d{1,2})[./](\d{1,2})[./](20\d{2})/);
  if (!dmy) return null;
  return `${dmy[3]}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;
}

export function isoWeek(date: Date): string {
  const copy = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy.toISOString().slice(0, 10);
}

function splitCsv(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function unzip(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 30 < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break;
    const method = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLen);
    const start = offset + 30 + nameLen + extraLen;
    const compressed = buffer.subarray(start, start + compSize);
    if (method === 0) files.set(name, Buffer.from(compressed));
    else if (method === 8) files.set(name, inflateRawSync(compressed));
    offset = start + compSize;
  }
  return files;
}

function decodeSharedStrings(xml: Buffer | undefined): string[] {
  if (!xml) return [];
  const text = xml.toString("utf8");
  const items = text.split(/<si\b[^>]*>/u).slice(1);
  return items.map((item) =>
    [...item.matchAll(/<t\b[^>]*>([^<]*)<\/t>/gu)]
      .map((match) => decodeXml(match[1] ?? ""))
      .join("")
  );
}

function rowsFromSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  for (const row of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gu)) {
    const cells: string[] = [];
    for (const cell of (row[1] ?? "").matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gu)) {
      const attrs = cell[1] ?? "";
      const body = cell[2] ?? "";
      const ref = attrs.match(/\br="([A-Z]+)\d+"/u)?.[1] ?? "";
      const index = columnIndex(ref);
      const type = attrs.match(/\bt="([^"]+)"/u)?.[1] ?? "";
      let value = "";
      if (type === "s") {
        const pointer = Number(body.match(/<v>(\d+)<\/v>/u)?.[1] ?? "");
        value = shared[pointer] ?? "";
      } else if (type === "inlineStr") {
        value = [...body.matchAll(/<t\b[^>]*>([^<]*)<\/t>/gu)]
          .map((match) => decodeXml(match[1] ?? ""))
          .join("");
      } else {
        value = body.match(/<v>([^<]*)<\/v>/u)?.[1] ?? "";
      }
      while (cells.length < index) cells.push("");
      cells[index] = decodeXml(value);
    }
    if (cells.some((cell) => cell.trim())) rows.push(cells);
  }
  return rows;
}

function columnIndex(letters: string): number {
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return Math.max(0, index - 1);
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
