import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBorderWebcam } from "@/lib/api-clients/border-webcams";

const WebcamQuerySchema = z.object({
  crossing_id: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const crossingId = request.nextUrl.searchParams.get("crossing_id");
    const parsed = WebcamQuerySchema.safeParse({ crossing_id: crossingId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    if (!crossingId) {
      return NextResponse.json(
        { error: "crossing_id is required", code: "MISSING_CROSSING" },
        { status: 400 }
      );
    }

    const webcam = await getBorderWebcam(crossingId);
    if (!webcam) {
      return NextResponse.json(
        { error: "Crossing not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      crossing_id: webcam.crossingId,
      label: webcam.label,
      image_url: webcam.imageUrl,
      player_url: webcam.playerUrl,
      nakordoni_url: webcam.nakordoniUrl,
      windy_url: webcam.windyUrl,
      source: webcam.source,
      attribution: webcam.attribution,
    });
  } catch (error) {
    console.error("Border webcam API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webcam", code: "WEBCAM_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
