/** Pictograms (24×24 stroke paths) drawn on a coloured pin for map points. */
export type PoiIcon = "fuel" | "ev" | "rest";

const PATHS: Record<PoiIcon, string[]> = {
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

export const POI_ICON_SIZE = 44;

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
