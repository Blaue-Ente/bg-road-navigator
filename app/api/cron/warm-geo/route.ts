import { NextResponse } from "next/server";
import { warmOciGeo } from "@/lib/api-clients/warm-geo";
import { authorizeCron } from "@/lib/server/cron-auth";

export const maxDuration = 20;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await warmOciGeo());
}
