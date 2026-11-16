import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getProfile } from "@/lib/db/profiles";
import {
  resolveDeparture,
  resolveTripPreferences,
  TripPreferencePatchSchema,
} from "@/lib/planner/preferences";
import { runTripPlan } from "@/lib/planner/run-plan";
import type { RouteChoice } from "@/lib/planner/types";
import { resolveVehicle } from "@/lib/planner/vehicle";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";
import type { Profile } from "@/types/profile.types";
import { catalog, parseLocale, type Locale } from "@/lib/i18n/locale";
import { resolvePlanLocale } from "@/lib/i18n/request-locale";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PointSchema = z.object({
  label: z.string().trim().min(1).max(160),
  lng: z.number().finite().min(-25).max(45),
  lat: z.number().finite().min(34).max(72),
  country_code: z.string().trim().length(2).optional(),
});

const PlanSchema = z.object({
  origin: PointSchema,
  destination: PointSchema,
  depart_at: z.string().datetime().optional(),
  fuel_level: z.number().finite().min(0.05).max(1).optional(),
  reserve_margin: z.number().finite().min(0.05).max(0.4).optional(),
  break_every_min: z.number().int().min(45).max(240).optional(),
  /**
   * Optional intermediate points, at most three. Omitted or empty keeps the
   * previous origin–destination contract. Points are ordered along the chord
   * together with a chosen border.
   */
  via: z.array(PointSchema).max(3).optional(),
  preferences: TripPreferencePatchSchema.optional(),
  locale: z.enum(["bg", "en", "tr", "ro"]).optional(),
  route_choice: z
    .union([
      z.object({
        kind: z.literal("border"),
        border_id: z.string().min(1).max(64),
      }),
      z.object({ kind: z.literal("valhalla_alternate") }),
    ])
    .optional(),
  vehicle: z
    .object({
      vehicle_type: z.enum(["car", "ev", "truck", "motorcycle"]).optional(),
      fuel_type: z.enum(["diesel", "petrol", "lpg", "electric"]).optional(),
      tank_capacity_liters: z
        .number()
        .finite()
        .min(8)
        .max(1500)
        .nullable()
        .optional(),
      ev_range_km: z.number().finite().min(50).max(2000).nullable().optional(),
      consumption_per_100: z.number().finite().min(1).max(80).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const locale = resolvePlanLocale(request);
  const api = catalog(locale).api;
  const limit = rateLimit(
    `plan:${clientIpFromHeaders(request.headers)}`,
    8,
    60_000
  );
  if (!limit.ok) {
    return NextResponse.json(
      { error: api.rateLimited, code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  const parsed = PlanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: api.invalidPlan, code: "INVALID_PLAN" },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const requestLocale = body.locale ? parseLocale(body.locale) : locale;
  const profile = await signedInProfile();
  const preferences = resolveTripPreferences(
    {
      ...body.preferences,
      ...(body.preferences?.break_every_min == null &&
      body.break_every_min != null
        ? { break_every_min: body.break_every_min }
        : {}),
    },
    profile?.trip_preferences
  );
  const departAt = resolveDeparture(preferences, body.depart_at, new Date());
  const vehicle = resolveVehicle({
    vehicle_type: profile?.vehicle_type ?? body.vehicle?.vehicle_type,
    fuel_type: profile?.fuel_type ?? body.vehicle?.fuel_type,
    tank_capacity_liters:
      profile?.tank_capacity_liters ?? body.vehicle?.tank_capacity_liters,
    ev_range_km: profile?.ev_range_km ?? body.vehicle?.ev_range_km,
    consumption_per_100: body.vehicle?.consumption_per_100,
    level: body.fuel_level,
    reserve: body.reserve_margin,
  });

  try {
    const plan = await runTripPlan({
      origin: {
        label: body.origin.label,
        coords: { lng: body.origin.lng, lat: body.origin.lat },
        countryCode: body.origin.country_code,
      },
      destination: {
        label: body.destination.label,
        coords: { lng: body.destination.lng, lat: body.destination.lat },
        countryCode: body.destination.country_code,
      },
      departAt,
      vehicle,
      fromProfile: Boolean(profile),
      preferences,
      via: body.via?.map((point) => ({
        label: point.label,
        coords: { lng: point.lng, lat: point.lat },
      })),
      routeChoice: body.route_choice as RouteChoice | undefined,
      locale: requestLocale,
    });
    if (!plan) {
      return NextResponse.json(
        {
          error: api.routeUnavailable,
          code: "ROUTE_UNAVAILABLE",
        },
        { status: 502 }
      );
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Trip plan failed:", error);
    return NextResponse.json(
      { error: api.planFailed, code: "PLAN_FAILED" },
      { status: 500 }
    );
  }
}

async function signedInProfile(): Promise<Profile | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return null;
    return await getProfile(session.user.id);
  } catch {
    return null;
  }
}
