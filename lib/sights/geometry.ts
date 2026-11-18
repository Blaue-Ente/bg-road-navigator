import { haversineKm } from "@/lib/geo/haversine";

export interface LinePosition {
  /** Straight-line distance from the point to the nearest part of the road. */
  offKm: number;
  /** Kilometres along the road from the start to that nearest part. */
  alongKm: number;
}

/**
 * Where a point sits against a road line: how far from it and how far along.
 * The line is [lng, lat] pairs; `totalKm` is the road length the plan uses,
 * so the along distance matches the plan's own kilometres.
 */
export function projectOnLine(
  line: Array<[number, number]>,
  point: { lng: number; lat: number },
  totalKm: number
): LinePosition | null {
  if (line.length < 2) return null;
  const cumulative = [0];
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1]!;
    const b = line[i]!;
    cumulative.push(
      cumulative[i - 1]! + haversineKm({ lng: a[0], lat: a[1] }, { lng: b[0], lat: b[1] })
    );
  }
  const lineKm = cumulative[cumulative.length - 1]!;
  if (lineKm <= 0) return null;
  const scale = totalKm > 0 ? totalKm / lineKm : 1;

  // Flat-earth projection around the point, good enough at these distances.
  const cosLat = Math.cos((point.lat * Math.PI) / 180);
  const toXY = (lng: number, lat: number): [number, number] => [
    (lng - point.lng) * 111.32 * cosLat,
    (lat - point.lat) * 110.57,
  ];
  let bestOff = Number.POSITIVE_INFINITY;
  let bestAlong = 0;
  for (let i = 1; i < line.length; i += 1) {
    const [ax, ay] = toXY(line[i - 1]![0], line[i - 1]![1]);
    const [bx, by] = toXY(line[i]![0], line[i]![1]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const px = ax + t * dx;
    const py = ay + t * dy;
    const off = Math.hypot(px, py);
    if (off < bestOff) {
      bestOff = off;
      bestAlong = cumulative[i - 1]! + t * (cumulative[i]! - cumulative[i - 1]!);
    }
  }
  return {
    offKm: Math.round(bestOff * 10) / 10,
    alongKm: Math.round(bestAlong * scale),
  };
}

/** Evenly spaced points along a line, away from the two ends. */
export function samplePoints(
  line: Array<[number, number]>,
  count: number
): Array<{ lng: number; lat: number; share: number }> {
  if (line.length < 2 || count < 1) return [];
  const out: Array<{ lng: number; lat: number; share: number }> = [];
  for (let i = 1; i <= count; i += 1) {
    const share = i / (count + 1);
    const at = line[Math.min(line.length - 1, Math.round(share * (line.length - 1)))]!;
    out.push({ lng: at[0], lat: at[1], share });
  }
  return out;
}
