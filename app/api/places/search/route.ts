import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchEuropeanPlaces } from "@/lib/api-clients/nominatim";

const QuerySchema = z.object({
  q: z.string().trim().min(3).max(120),
});

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Search query must contain 3 to 120 characters." },
      { status: 400 }
    );
  }

  const places = await searchEuropeanPlaces(parsed.data.q);
  return NextResponse.json({ places });
}
