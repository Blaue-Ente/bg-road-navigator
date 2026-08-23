import type { Route, RoutePoint } from "@/types/route.types";

export async function requestCalculatedRoute(params: {
  corridorId?: string;
  points?: RoutePoint[];
}): Promise<Route | null> {
  const response = await fetch("/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      corridor_id: params.corridorId,
      points: params.points,
    }),
  });

  if (!response.ok) return null;
  return (await response.json()) as Route;
}
