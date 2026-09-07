import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  clientIpFromHeaders,
  limitForPath,
  rateLimit,
} from "@/lib/server/rate-limit";
import {
  applySecurityHeaders,
  applyStrictCors,
} from "@/lib/server/security-headers";

function withCommonHeaders(response: NextResponse, request: NextRequest) {
  applySecurityHeaders(response.headers);
  applyStrictCors(response.headers, request);
  return response;
}

function rateLimitResponse(
  request: NextRequest,
  resetAt: number,
  limit: number
) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const response = NextResponse.json(
    { error: "Too many requests", code: "RATE_LIMITED" },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(retryAfter));
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", "0");
  return withCommonHeaders(response, request);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      return withCommonHeaders(preflight, request);
    }
    const { limit, windowMs } = limitForPath(pathname);
    const ip = clientIpFromHeaders(request.headers);
    const result = rateLimit(
      `${ip}:${pathname}:${request.method}`,
      limit,
      windowMs
    );
    if (!result.ok) {
      return rateLimitResponse(request, result.resetAt, result.limit);
    }
    const response = NextResponse.next({ request });
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    return withCommonHeaders(response, request);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return withCommonHeaders(NextResponse.next({ request }), request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();
  return withCommonHeaders(response, request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)",
  ],
};
