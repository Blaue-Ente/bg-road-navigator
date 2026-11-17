/** Pictograms (24×24 stroke paths) drawn on a coloured pin for map points. */
export type PoiIcon =
  | "fuel"
  | "ev"
  | "rest"
  | "border"
  | "webcam"
  | "speed"
  | "alert"
  | "car"
  | "shield"
  | "cone"
  | "bed"
  | "pin"
  | "shortcut"
  | "info"
  | "siren"
  | "ban"
  | "lanes"
  | "cloud";

const PATHS: Record<PoiIcon, string[]> = {
  siren: [], ban: [], lanes: [], cloud: [],
  border: [], webcam: [], speed: [], alert: [], car: [], shield: [], cone: [], bed: [], pin: [], shortcut: [], info: [],
  fuel: [
    "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5",
    "M14 21V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16",
    "M2 21h13",
    "M3 9h11",
  ],
  ev: [
    "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
  ],
  rest: [
    "M10 2v2",
    "M14 2v2",
    "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",
    "M6 2v2",
  ],
};

PATHS.border = [
  "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
];
PATHS.webcam = [
  "M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
];
PATHS.speed = ["m12 14 4-4", "M3.34 19a10 10 0 1 1 17.32 0"];
PATHS.alert = [
  "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
  "M12 9v4",
  "M12 17h.01",
];
PATHS.car = [
  "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
  "M7 17h10",
  "M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
  "M19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
];
PATHS.shield = [
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
];
PATHS.cone = ["M9.5 4h5l4 14h-13z", "M3 21h18", "M7.5 12h9"];
PATHS.bed = ["M2 4v16", "M2 8h18a2 2 0 0 1 2 2v10", "M2 17h20", "M6 8v9"];
PATHS.pin = [
  "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
  "M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
];
PATHS.shortcut = ["M7 7h10v10", "M7 17 17 7"];
PATHS.info = [
  "M12 16v-4",
  "M12 8h.01",
  "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
];

PATHS.siren = [
  "M7 18v-6a5 5 0 1 1 10 0v6",
  "M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1z",
  "M21 12h1",
  "M18.5 4.5 18 5",
  "M2 12h1",
  "M12 2v1",
  "m4.929 4.929.707.707",
  "M12 12v6",
];
PATHS.ban = ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z", "m4.9 4.9 14.2 14.2"];
PATHS.lanes = ["m8 6 4-4 4 4", "M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22", "m20 22-5-5"];
PATHS.cloud = [
  "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
  "M16 14v6",
  "M8 14v6",
  "M12 16v6",
];

export const POI_ICON_SIZE = 44;

/** The same pin as an SVG string, for DOM markers. */
export function poiIconSvg(icon: PoiIcon, color: string, size = 28): string {
  const paths = PATHS[icon].map((d) => `<path d="${d}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">` +
    `<circle cx="22" cy="22" r="20" fill="${color}" stroke="#fff" stroke-width="3"/>` +
    `<g transform="translate(11 11) scale(0.9167)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
    `</svg>`
  );
}

export function poiIconId(icon: PoiIcon, color: string): string {
  return `poi-icon-${icon}-${color.replace("#", "")}`;
}

/** Pixel data for `map.addImage`, drawn at 2× for sharp pins on phones. */
export function drawPoiIcon(
  icon: PoiIcon,
  color: string,
  ratio = 2
): ImageData | null {
  if (typeof document === "undefined") return null;
  const size = POI_ICON_SIZE * ratio;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const center = size / 2;
  ctx.beginPath();
  ctx.arc(center, center, center - 2 * ratio, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3 * ratio;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  const glyph = (POI_ICON_SIZE * 0.5 * ratio) / 24;
  ctx.save();
  ctx.translate(center - 12 * glyph, center - 12 * glyph);
  ctx.scale(glyph, glyph);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const path of PATHS[icon]) ctx.stroke(new Path2D(path));
  ctx.restore();
  return ctx.getImageData(0, 0, size, size);
}
