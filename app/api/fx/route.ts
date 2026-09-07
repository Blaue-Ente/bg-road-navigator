import { NextResponse } from "next/server";
import { fetchEuroRates } from "@/lib/api-clients/frankfurter";

export async function GET() {
  const quote = await fetchEuroRates();
  if (!quote) {
    return NextResponse.json(
      { error: "FX unavailable", code: "FX_UNAVAILABLE" },
      { status: 503 }
    );
  }
  return NextResponse.json(quote);
}
