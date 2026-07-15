import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchBorderStatus } from "@/lib/api-clients/border-scraper";

const BorderQuerySchema = z.object({
  crossing_id: z.string().optional(),
  region: z
    .enum([
      "all",
      "bulgaria",
      "balkans",
      "central",
      "western",
      "southern",
      "eastern",
      "route",
    ])
    .optional(),
  corridor_id: z.string().optional(),
  border_ids: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const crossingId = searchParams.get("crossing_id");
    const region = searchParams.get("region");
    const corridorId = searchParams.get("corridor_id");
    const borderIds = searchParams.get("border_ids");

    const parsed = BorderQuerySchema.safeParse({
      crossing_id: crossingId ?? undefined,
      region: region ?? undefined,
      corridor_id: corridorId ?? undefined,
      border_ids: borderIds ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    const borderStatus = await fetchBorderStatus({
      crossingId: parsed.data.crossing_id,
      region: parsed.data.region,
      corridorId: parsed.data.corridor_id,
      borderIds: parsed.data.border_ids
        ? parsed.data.border_ids.split(",").filter(Boolean)
        : undefined,
    });

    return NextResponse.json(borderStatus);
  } catch (error) {
    console.error("Borders API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch border data", code: "BORDER_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
