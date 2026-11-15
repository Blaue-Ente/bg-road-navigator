import { describe, expect, it } from "vitest";
import {
  bulletinLinkFromHtml,
  isoWeek,
  parseOilBulletinCsv,
  parseOilBulletinXlsx,
} from "@/lib/fuel-prices/oil-bulletin";

describe("weekly oil bulletin", () => {
  it("reads euro-super 95 and diesel, including prices per 1000 litres", () => {
    const csv = [
      "Prices with taxes, reference 2026-11-09",
      "Country,Euro-super 95,Diesel",
      "Bulgaria,1350,1420",
      "Austria,1550,1600",
      "Euro area,1500,1550",
    ].join("\n");
    const prices = parseOilBulletinCsv(csv, "2026-11-09");
    expect(prices).toEqual([
      {
        countryCode: "BG",
        fuel: "petrol",
        eurPerLitre: 1.35,
        week: "2026-11-09",
      },
      {
        countryCode: "BG",
        fuel: "diesel",
        eurPerLitre: 1.42,
        week: "2026-11-09",
      },
      {
        countryCode: "AT",
        fuel: "petrol",
        eurPerLitre: 1.55,
        week: "2026-11-09",
      },
      {
        countryCode: "AT",
        fuel: "diesel",
        eurPerLitre: 1.6,
        week: "2026-11-09",
      },
    ]);
  });

  it("reads the same table from an xlsx sheet", () => {
    const prices = parseOilBulletinXlsx(
      xlsxWithSheet([
        ["Country", "Euro-super 95", "Diesel"],
        ["Germany", "1.72", "1.64"],
      ]),
      "2026-11-09"
    );
    expect(prices).toEqual([
      {
        countryCode: "DE",
        fuel: "petrol",
        eurPerLitre: 1.72,
        week: "2026-11-09",
      },
      {
        countryCode: "DE",
        fuel: "diesel",
        eurPerLitre: 1.64,
        week: "2026-11-09",
      },
    ]);
  });

  it("finds the official with-taxes workbook on the bulletin page", () => {
    const href = bulletinLinkFromHtml(`
      <a href="/document/download/abc_en?filename=other.xlsx">other</a>
      <a href="https://energy.ec.europa.eu/files/prices-with-taxes.xlsx">prices</a>
    `);
    expect(href).toBe(
      "https://energy.ec.europa.eu/files/prices-with-taxes.xlsx"
    );
  });

  it("stores the Monday of the fetch week", () => {
    expect(isoWeek(new Date("2026-11-15T12:00:00.000Z"))).toBe("2026-11-09");
  });
});

function xlsxWithSheet(rows: string[][]): Buffer {
  const shared: string[] = [];
  const indexOf = (value: string) => {
    let index = shared.indexOf(value);
    if (index < 0) {
      index = shared.length;
      shared.push(value);
    }
    return index;
  };
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, column) => {
          const letter = String.fromCharCode(65 + column);
          const ref = `${letter}${rowIndex + 1}`;
          if (/^-?\d+(\.\d+)?$/.test(value)) {
            return `<c r="${ref}"><v>${value}</v></c>`;
          }
          return `<c r="${ref}" t="s"><v>${indexOf(value)}</v></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  const sheet = `<?xml version="1.0"?><worksheet><sheetData>${sheetRows}</sheetData></worksheet>`;
  const strings = `<?xml version="1.0"?><sst>${shared
    .map((value) => `<si><t>${value}</t></si>`)
    .join("")}</sst>`;
  return zipStored([
    ["xl/sharedStrings.xml", strings],
    ["xl/worksheets/sheet1.xml", sheet],
  ]);
}

function zipStored(files: Array<[string, string]>): Buffer {
  const parts: Buffer[] = [];
  for (const [name, text] of files) {
    const data = Buffer.from(text);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(Buffer.byteLength(name), 26);
    header.writeUInt16LE(0, 28);
    parts.push(header, Buffer.from(name), data);
  }
  return Buffer.concat(parts);
}
