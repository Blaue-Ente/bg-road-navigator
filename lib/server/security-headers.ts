const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://*.basemaps.cartocdn.com https://fonts.basemaps.cartocdn.com",
  "worker-src 'self' blob:",
  "child-src blob:",
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://basemaps.cartocdn.com",
    "https://*.basemaps.cartocdn.com",
    "https://*.cartocdn.com",
    "https://demotiles.maplibre.org",
    "https://*.windy.com",
    "https://nominatim.openstreetmap.org",
  ].join(" "),
  "frame-src https://webcams.windy.com https://www.windy.com",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), geolocation=(self), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

export function applySecurityHeaders(headers: Headers) {
  for (const { key, value } of SECURITY_HEADERS) {
    headers.set(key, value);
  }
}

/** Same-origin by default; reflect NEXT_PUBLIC_APP_URL only when it matches Origin. */
export function applyStrictCors(headers: Headers, request: Request) {
  const origin = request.headers.get("origin");
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!origin || !configured) return;
  try {
    const allowed = new URL(configured).origin;
    if (origin === allowed) {
      headers.set("Access-Control-Allow-Origin", allowed);
      headers.set("Vary", "Origin");
      headers.set(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,DELETE,OPTIONS"
      );
      headers.set("Access-Control-Allow-Headers", "content-type");
      headers.set("Access-Control-Allow-Credentials", "true");
    }
  } catch {
    // invalid NEXT_PUBLIC_APP_URL — omit CORS (browser same-origin only)
  }
}
