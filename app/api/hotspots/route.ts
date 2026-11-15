import { NextRequest, NextResponse } from "next/server";
import { hotspotsInBbox, loadHotspotFile } from "@/lib/hotspots/load";
import { attributionsFor } from "@/lib/hotspots/sources";

export async function GET(request: NextRequest) {
  const file = loadHotspotFile();
  const credits = attributionsFor(
    file.hotspots.map((hotspot) => hotspot.source_id)
  );
  const west = numberParam(request, "west");
  const south = numberParam(request, "south");
  const east = numberParam(request, "east");
  const north = numberParam(request, "north");
  if (
    west == null ||
    south == null ||
    east == null ||
    north == null ||
    west >= east ||
    south >= north
  ) {
    return NextResponse.json({
      hotspots: [],
      truncated: false,
      counts: file.counts,
      credits,
      notes: file.notes,
    });
  }

  const slice = hotspotsInBbox(file.hotspots, { west, south, east, north });
  return NextResponse.json({
    hotspots: slice.hotspots,
    truncated: slice.truncated,
    counts: file.counts,
    credits,
    notes: file.notes,
  });
}

function numberParam(request: NextRequest, key: string): number | null {
  const value = Number(request.nextUrl.searchParams.get(key));
  return Number.isFinite(value) ? value : null;
}
