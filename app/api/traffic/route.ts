import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTrafficFlow, getTrafficIncidents } from "@/lib/api-clients/tomtom";

const TrafficQuerySchema = z.object({
  bbox: z.string().optional(),
  zoom: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bbox = searchParams.get("bbox");
    const zoom = searchParams.get("zoom");

    const parsed = TrafficQuerySchema.safeParse({ bbox, zoom });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    // Parse bbox: "w,s,e,n"
    let boundingBox: { w: number; s: number; e: number; n: number } | null = null;
    if (bbox) {
      const [w, s, e, n] = bbox.split(",").map(Number);
      if (w && s && e && n) {
        boundingBox = { w, s, e, n };
      }
    }

    const zoomLevel = parsed.data.zoom ?? 12;

    const [flow, incidents] = await Promise.all([
      getTrafficFlow(boundingBox, zoomLevel),
      getTrafficIncidents(boundingBox),
    ]);

    return NextResponse.json({ flow, incidents });
  } catch (error) {
    console.error("Traffic API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic data", code: "TRAFFIC_FETCH_FAILED" },
      { status: 500 }
    );
  }
}