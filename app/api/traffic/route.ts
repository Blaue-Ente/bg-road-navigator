import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTrafficFlow, getTrafficIncidents } from "@/lib/api-clients/tomtom";
import { EuropeBboxSchema } from "@/lib/server/geo-schema";

const TrafficQuerySchema = z.object({
  bbox: z.string().max(80).optional(),
  zoom: z.coerce.number().min(3).max(18).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = TrafficQuerySchema.safeParse({
      bbox: searchParams.get("bbox") ?? undefined,
      zoom: searchParams.get("zoom") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    let boundingBox: { w: number; s: number; e: number; n: number } | null =
      null;
    if (parsed.data.bbox) {
      const parts = parsed.data.bbox.split(",").map(Number);
      const candidate = {
        w: parts[0],
        s: parts[1],
        e: parts[2],
        n: parts[3],
      };
      const bboxParsed = EuropeBboxSchema.safeParse(candidate);
      if (!bboxParsed.success) {
        return NextResponse.json(
          { error: "Invalid bbox", code: "INVALID_BBOX" },
          { status: 400 }
        );
      }
      boundingBox = bboxParsed.data;
    }

    const [flow, incidents] = await Promise.all([
      getTrafficFlow(boundingBox),
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
