import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchBorderStatus } from "@/lib/api-clients/border-scraper";

const BorderQuerySchema = z.object({
  crossing_id: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const crossingId = searchParams.get("crossing_id");

    const parsed = BorderQuerySchema.safeParse({ crossing_id: crossingId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    const borderStatus = await fetchBorderStatus(crossingId ?? undefined);

    return NextResponse.json(borderStatus);
  } catch (error) {
    console.error("Borders API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch border data", code: "BORDER_FETCH_FAILED" },
      { status: 500 }
    );
  }
}